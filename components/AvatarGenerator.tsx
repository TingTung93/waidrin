// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import React, { useState, useEffect } from "react";
import type { Character } from "@/lib/state";

interface AvatarGeneratorProps {
  character: Character;
  onAvatarGenerated?: (character: Character, avatarData: AvatarData) => void;
  pluginEnabled?: boolean;
}

interface AvatarData {
  url: string;
  seed?: number;
  id?: string;
  style?: string;
}

interface GenerationProgress {
  status: "idle" | "generating" | "complete" | "error";
  progress: number;
  message?: string;
}

const avatarStyles = {
  realistic: "Realistic Portrait",
  fantasy: "Fantasy Art",
  anime: "Anime Style",
  painted: "Oil Painting"
};

export function AvatarGenerator({ character, onAvatarGenerated, pluginEnabled = false }: AvatarGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof avatarStyles>("realistic");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    status: "idle",
    progress: 0
  });
  const [generatedAvatars, setGeneratedAvatars] = useState<AvatarData[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

  // Check if image generation plugin is loaded
  const [pluginAvailable, setPluginAvailable] = useState(false);

  useEffect(() => {
    // Check if the image generation plugin is available
    const checkPlugin = async () => {
      try {
        const response = await fetch("/plugins");
        const plugins = await response.json();
        const imageGenPlugin = plugins.find((p: any) => p.name === "Image Generation");
        setPluginAvailable(!!imageGenPlugin);
      } catch (error) {
        console.error("Failed to check for image generation plugin:", error);
      }
    };

    if (pluginEnabled) {
      checkPlugin();
    }
  }, [pluginEnabled]);

  const generateAvatar = async () => {
    if (!pluginAvailable) {
      setGenerationProgress({
        status: "error",
        progress: 0,
        message: "Image generation plugin is not available"
      });
      return;
    }

    setGenerationProgress({
      status: "generating",
      progress: 0,
      message: "Initializing generation..."
    });

    try {
      // Call the plugin's avatar generation endpoint
      const response = await fetch("/api/plugins/image-generation/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          character: {
            name: character.name,
            gender: character.gender,
            race: character.race,
            biography: character.biography
          },
          style: selectedStyle,
          customPrompt: customPrompt || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      // Handle streaming progress updates
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "progress") {
                setGenerationProgress({
                  status: "generating",
                  progress: data.progress,
                  message: data.message
                });
              } else if (data.type === "complete") {
                const avatarData: AvatarData = {
                  url: data.url,
                  seed: data.seed,
                  id: data.id,
                  style: selectedStyle
                };
                
                setGeneratedAvatars(prev => [...prev, avatarData]);
                setGenerationProgress({
                  status: "complete",
                  progress: 100,
                  message: "Avatar generated successfully!"
                });
                
                if (onAvatarGenerated) {
                  onAvatarGenerated(character, avatarData);
                }
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Failed to parse progress data:", e);
            }
          }
        }
      }
    } catch (error) {
      setGenerationProgress({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Generation failed"
      });
    }
  };

  const generatePromptPreview = () => {
    if (customPrompt) return customPrompt;

    let prompt = `${character.name}, ${character.gender} ${character.race}`;
    
    // Extract physical descriptions from biography
    const bioLower = character.biography.toLowerCase();
    const physicalKeywords = ["hair", "eyes", "skin", "tall", "short", "muscular", "slim"];
    const descriptions: string[] = [];
    
    for (const keyword of physicalKeywords) {
      const regex = new RegExp(`\\b([^.]*${keyword}[^.]*)\\b`, "i");
      const match = character.biography.match(regex);
      if (match) {
        descriptions.push(match[1].trim());
      }
    }
    
    if (descriptions.length > 0) {
      prompt += ", " + descriptions.join(", ");
    }
    
    return prompt;
  };

  if (!pluginEnabled) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-gray-500">
        <p>Avatar generation is available with the Image Generation plugin.</p>
      </div>
    );
  }

  if (!pluginAvailable) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-yellow-800">
          Image Generation plugin is not installed. Install it from the plugins directory to enable avatar generation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Generate Character Avatar</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Art Style
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as keyof typeof avatarStyles)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              disabled={generationProgress.status === "generating"}
            >
              {Object.entries(avatarStyles).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Prompt (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={generatePromptPreview()}
              className="w-full rounded-md border border-gray-300 px-3 py-2 h-24 resize-none"
              disabled={generationProgress.status === "generating"}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to auto-generate from character details
            </p>
          </div>
          
          <button
            onClick={generateAvatar}
            disabled={generationProgress.status === "generating"}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              generationProgress.status === "generating"
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {generationProgress.status === "generating" 
              ? `Generating... ${generationProgress.progress}%`
              : "Generate Avatar"}
          </button>
          
          {generationProgress.message && (
            <div className={`p-3 rounded-md text-sm ${
              generationProgress.status === "error" 
                ? "bg-red-50 text-red-800 border border-red-200"
                : generationProgress.status === "complete"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}>
              {generationProgress.message}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generated Avatars
          </label>
          {generatedAvatars.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              No avatars generated yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {generatedAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedAvatar === index 
                      ? "border-blue-500 shadow-lg" 
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedAvatar(index)}
                >
                  <img
                    src={avatar.url}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === index && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium">
                        Selected
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    {avatarStyles[avatar.style || "realistic"]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {generationProgress.status === "generating" && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${generationProgress.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}