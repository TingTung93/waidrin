// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import { NextRequest } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character, style, customPrompt } = body;

    // Load the image generation plugin
    const pluginsDir = process.env.PLUGINS_DIR || path.join(process.cwd(), "plugins");
    const pluginPath = path.join(pluginsDir, "image-generation");
    
    // Check if plugin exists
    let plugin;
    try {
      const manifestPath = path.join(pluginPath, "manifest.json");
      const manifestContent = await readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(manifestContent);
      
      // Load the plugin module
      const pluginModule = require(path.join(pluginPath, manifest.main));
      
      // Initialize plugin with settings from manifest
      if (pluginModule.init) {
        await pluginModule.init(manifest.settings, {
          addBackendUI: () => {} // Dummy context for API route
        });
      }
      
      plugin = pluginModule;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Image generation plugin not found or failed to load" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a stream for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "progress", progress: 0, message: "Starting generation..." })}\n\n`)
          );

          // Generate the avatar
          const result = await plugin.generateAvatar(character, style || "realistic");

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