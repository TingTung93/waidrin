// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { current, isDraft } from "immer";
import OpenAI from "openai";
import * as z from "zod/v4";
import type { Prompt } from "./prompts";
import { getState } from "./state";

export type TokenCallback = (token: string, count: number) => void;

export interface Backend {
  getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string>;

  getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type>;

  abort(): void;

  isAbortError(error: unknown): boolean;
}

export interface ModelInfo {
  id: string;
  name?: string;
  description?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  isFree?: boolean;
}

export async function fetchAvailableModels(apiUrl: string, apiKey?: string): Promise<ModelInfo[]> {
  try {
    console.log("Fetching models from:", apiUrl, "with API key:", apiKey ? "provided" : "not provided");
    
    const client = new OpenAI({
      baseURL: `${apiUrl}/v1/`,
      apiKey: apiKey || "",
      dangerouslyAllowBrowser: true,
    });

    console.log("Making request to:", `${apiUrl}/v1/models`);
    const response = await client.models.list();
    console.log("Raw models response:", response);
    
    let models = response.data.map(model => {
      // Check if this is an OpenRouter response with additional metadata
      const modelData = model as any;
      const isFree = modelData.pricing?.prompt === '0' || modelData.pricing?.completion === '0' || 
                    modelData.id.includes('free') || modelData.context_length === undefined;
      
      return {
        id: model.id,
        name: modelData.name || model.id,
        description: modelData.description || model.id,
        pricing: modelData.pricing,
        isFree,
      };
    });
    
    // Sort models: free first, then by name
    models.sort((a, b) => {
      if (a.isFree !== b.isFree) {
        return a.isFree ? -1 : 1; // Free models first
      }
      return a.name?.localeCompare(b.name || '') || 0;
    });
    
    console.log("Parsed and sorted models:", models);
    return models;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Try to handle common OpenRouter response issues
    if (error instanceof Error && error.message.includes('JSON')) {
      console.error("JSON parsing failed. The API might be returning a non-JSON response.");
      console.error("This often happens when there's an authentication or rate limiting issue.");
    }
    
    return [];
  }
}

class DefaultBackend implements Backend {
  controller = new AbortController();

  async *getResponseStream(prompt: Prompt, params: Record<string, unknown> = {}): AsyncGenerator<string> {
    try {
      const state = getState();

      const client = new OpenAI({
        baseURL: `${state.apiUrl}/v1/`,
        apiKey: state.apiKey || "",
        dangerouslyAllowBrowser: true,
      });

      const stream = await client.chat.completions.create(
        {
          stream: true,
          model: state.model || "",
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          // These are hardcoded because the required number depends on
          // what is being prompted for, which is also hardcoded.
          max_tokens: 4096,
          // Both variants need to be provided, as newer OpenAI models
          // don't support max_tokens, while some inference engines don't
          // support max_completion_tokens.
          max_completion_tokens: 4096,
          ...params,
        },
        { signal: this.controller.signal },
      );

      for await (const chunk of stream) {
        if (chunk.choices.length === 0) {
          // We must return directly here instead of just breaking the loop,
          // because the OpenAI library calls controller.abort() if streaming
          // is stopped, which would trigger the error-throwing code below.
          return;
        }

        const choice = chunk.choices[0];

        if (choice.delta.content) {
          yield choice.delta.content;
        }

        if (choice.finish_reason) {
          return;
        }
      }

      // The OpenAI library only throws this error if abort() is called
      // during the request itself, not if it is called while the
      // response is being streamed. We throw it manually in this case,
      // so error handling code can easily detect whether an error
      // is the result of a user abort.
      if (stream.controller.signal.aborted) {
        throw new OpenAI.APIUserAbortError();
      }
    } finally {
      // An AbortController cannot be reused after calling abort().
      // Reset the controller so a new one is available for the next operation
      // in case this operation was aborted.
      this.controller = new AbortController();
    }
  }

  async getResponse(prompt: Prompt, params: Record<string, unknown> = {}, onToken?: TokenCallback): Promise<string> {
    const state = getState();

    if (state.logPrompts) {
      console.log(prompt.user);
    }

    if (state.logParams) {
      console.log(isDraft(params) ? current(params) : params);
    }

    let response = "";
    let count = 0;

    // Send empty update at the start of the streaming process
    // to facilitate displaying progress indicators.
    if (onToken) {
      onToken("", 0);
    }

    for await (const token of this.getResponseStream(prompt, params)) {
      response += token;
      count++;

      if (onToken) {
        onToken(token, count);
      }
    }

    if (state.logResponses) {
      console.log(response);
    }

    return response;
  }

  async getNarration(prompt: Prompt, onToken?: TokenCallback): Promise<string> {
    return await this.getResponse(prompt, getState().narrationParams, onToken);
  }

  async getObject<Schema extends z.ZodType, Type extends z.infer<Schema>>(
    prompt: Prompt,
    schema: Schema,
    onToken?: TokenCallback,
  ): Promise<Type> {
    const response = await this.getResponse(
      prompt,
      {
        ...getState().generationParams,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "schema",
            strict: true,
            schema: z.toJSONSchema(schema),
          },
        },
      },
      onToken,
    );

    return schema.parse(JSON.parse(response)) as Type;
  }

  abort(): void {
    this.controller.abort();
  }

  isAbortError(error: unknown): boolean {
    return error instanceof OpenAI.APIUserAbortError;
  }
}

const defaultBackend = new DefaultBackend();

export function getBackend(): Backend {
  const state = getState();
  return Object.hasOwn(state.backends, state.activeBackend) ? state.backends[state.activeBackend] : defaultBackend;
}
