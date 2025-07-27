// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import { NextRequest } from "next/server";

// Avatar style presets
const avatarStyles: Record<string, { prompt: string; negativePrompt: string }> = {
  realistic: {
    prompt: "portrait photo, realistic, professional headshot, high quality, 8k",
    negativePrompt: "cartoon, anime, drawing, painting, low quality, blurry"
  },
  fantasy: {
    prompt: "fantasy character portrait, detailed, magical, epic fantasy art style",
    negativePrompt: "photo, realistic, modern, contemporary"
  },
  anime: {
    prompt: "anime character portrait, manga style, detailed anime art",
    negativePrompt: "realistic, photo, 3d render"
  },
  painted: {
    prompt: "oil painting portrait, artistic, painterly, classical art style",
    negativePrompt: "photo, digital art, 3d render, anime"
  }
};

// Generate character prompt from character data
function generateCharacterPrompt(character: any, style: string = "realistic") {
  const styleData = avatarStyles[style] || avatarStyles.realistic;
  
  let prompt = `${character.name}, ${character.gender} ${character.race}`;
  
  // Add physical description from biography if available
  const bioLower = character.biography.toLowerCase();
  const physicalKeywords = ["hair", "eyes", "skin", "tall", "short", "muscular", "slim", "age", "young", "old"];
  const relevantDescriptions: string[] = [];
  
  for (const keyword of physicalKeywords) {
    const regex = new RegExp(`\\b([^.]*${keyword}[^.]*)\\b`, "i");
    const match = character.biography.match(regex);
    if (match) {
      relevantDescriptions.push(match[1].trim());
    }
  }
  
  if (relevantDescriptions.length > 0) {
    prompt += ", " + relevantDescriptions.join(", ");
  }
  
  prompt += ", " + styleData.prompt;
  
  return {
    prompt,
    negativePrompt: styleData.negativePrompt,
    style
  };
}

// Black Forest Labs provider
async function generateWithBlackForest(options: any) {
  const { prompt, negativePrompt, width, height, settings } = options;
  
  if (!settings.apiKey) {
    throw new Error("Black Forest Labs API key is required");
  }
  
  const response = await fetch(`https://api.bfl.ml/v1/flux-${settings.model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": settings.apiKey
    },
    body: JSON.stringify({
      prompt: prompt,
      width: width,
      height: height,
      prompt_upsampling: false,
      seed: Math.floor(Math.random() * 1000000),
      safety_tolerance: 2,
      output_format: "jpeg"
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Black Forest Labs API error: ${error}`);
  }
  
  const result = await response.json();
  const taskId = result.id;
  
  // Poll for result
  let attempts = 0;
  const maxAttempts = 60;
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://api.bfl.ml/v1/get_result?id=${taskId}`, {
      headers: {
        "X-Key": settings.apiKey
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error("Failed to check generation status");
    }
    
    const status = await statusResponse.json();
    
    if (status.status === "Ready") {
      return {
        url: status.result.sample,
        seed: status.result.seed,
        id: taskId
      };
    } else if (status.status === "Error") {
      throw new Error(`Generation failed: ${status.error || "Unknown error"}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error("Generation timed out");
}

// Stable Horde provider
async function generateWithStableHorde(options: any) {
  const { prompt, negativePrompt, width, height, steps, cfgScale, sampler, settings } = options;
  
  const apiKey = settings.apiKey || "0000000000";
  
  const response = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": apiKey
    },
    body: JSON.stringify({
      prompt: negativePrompt ? `${prompt} ### ${negativePrompt}` : prompt,
      params: {
        sampler_name: sampler || "k_euler_a",
        cfg_scale: cfgScale,
        denoising_strength: 1,
        height: height,
        width: width,
        seed_variation: 1000,
        post_processing: [],
        karras: true,
        steps: steps,
        n: 1
      },
      nsfw: false,
      trusted_workers: false,
      slow_workers: true,
      censor_nsfw: false,
      models: settings.models || ["stable_diffusion"],
      r2: true,
      shared: false
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stable Horde API error: ${error.message || "Unknown error"}`);
  }
  
  const { id } = await response.json();
  
  // Poll for result
  let attempts = 0;
  const maxAttempts = 120;
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`, {
      headers: {
        "apikey": apiKey
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error("Failed to check generation status");
    }
    
    const status = await statusResponse.json();
    
    if (status.done) {
      const resultResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
        headers: {
          "apikey": apiKey
        }
      });
      
      if (!resultResponse.ok) {
        throw new Error("Failed to get generation result");
      }
      
      const result = await resultResponse.json();
      
      if (result.generations && result.generations.length > 0) {
        const generation = result.generations[0];
        return {
          url: generation.img,
          seed: generation.seed,
          id: id
        };
      } else {
        throw new Error("No generations found");
      }
    } else if (status.faulted) {
      throw new Error("Generation faulted");
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error("Generation timed out");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character, style, customPrompt, settings } = body;

    if (!settings || !settings.provider) {
      return new Response(
        JSON.stringify({ error: "No provider configured" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate prompt
    const characterPrompt = generateCharacterPrompt(character, style);
    const finalPrompt = customPrompt || characterPrompt.prompt;

    // Create a stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "progress", progress: 0, message: "Starting generation..." })}\n\n`)
          );

          let result;
          
          // Generate based on provider
          switch (settings.provider) {
            case "blackforest":
              result = await generateWithBlackForest({
                prompt: finalPrompt,
                negativePrompt: characterPrompt.negativePrompt,
                width: settings.defaults.width,
                height: settings.defaults.height,
                settings: settings.blackforest
              });
              break;
              
            case "stableHorde":
              result = await generateWithStableHorde({
                prompt: finalPrompt,
                negativePrompt: characterPrompt.negativePrompt,
                width: settings.defaults.width,
                height: settings.defaults.height,
                steps: settings.defaults.steps,
                cfgScale: settings.defaults.cfgScale,
                sampler: settings.defaults.sampler,
                settings: settings.stableHorde
              });
              break;
              
            case "comfyui":
              // ComfyUI would require WebSocket handling, simplified for now
              throw new Error("ComfyUI support requires additional setup");
              
            default:
              throw new Error(`Unknown provider: ${settings.provider}`);
          }

          // Send completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "complete", 
              url: result.url,
              seed: result.seed,
              id: result.id
            })}\n\n`)
          );

          controller.close();
        } catch (error) {
          // Send error
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              message: error instanceof Error ? error.message : "Generation failed"
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}