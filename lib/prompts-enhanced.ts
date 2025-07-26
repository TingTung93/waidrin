// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import type { State } from "./state";
import type { Prompt } from "./prompts";
import { 
  getTemplateWorldPrompt, 
  getTemplateCharacterPrompt, 
  getTemplateLocationPrompt,
  getTemplateNarrationContext 
} from "./template-integration";

/**
 * Enhanced prompt generation that integrates with scenario templates
 * This extends the existing prompt system with template awareness
 */

export function generateEnhancedWorldPrompt(state: State): Prompt {
  const baseGenrePrompts = {
    fantasy: "You are the game master of a text-based fantasy role-playing game set in a world of magic, mythical creatures, and medieval adventure.",
    scifi: "You are the game master of a text-based science fiction role-playing game set in a futuristic world with advanced technology, space travel, and alien civilizations.",
    modern: "You are the game master of a text-based modern role-playing game set in contemporary times with realistic scenarios and characters.",
    horror: "You are the game master of a text-based horror role-playing game focused on creating suspenseful, frightening, and atmospheric experiences.",
    romance: "You are the game master of a text-based romance role-playing game focused on relationships, emotional connections, and romantic storylines.",
    historical: "You are the game master of a text-based historical role-playing game set in a specific time period with accurate historical context and details.",
    custom: "You are the game master of a text-based role-playing game. Adapt your style and content to match the custom setting and genre specified in the game context.",
  };

  // Use template-enhanced prompt if available
  if (state.scenarioTemplate) {
    return {
      system: baseGenrePrompts[state.selectedGenre] || baseGenrePrompts.fantasy,
      user: getTemplateWorldPrompt(state.scenarioTemplate)
    };
  }

  // Fall back to basic genre prompt
  const genreInstructions = {
    fantasy: "Create a fictional world for a fantasy adventure RPG with magic, mythical creatures, and medieval settings. The world is populated by humans, elves, and dwarves.",
    scifi: "Create a fictional world for a science fiction RPG with advanced technology, space travel, and alien civilizations. Include futuristic elements and technological wonders.",
    modern: "Create a fictional world for a modern-day RPG set in contemporary times. Focus on realistic locations, current technology, and modern society.",
    horror: "Create a fictional world for a horror RPG with dark, foreboding atmosphere. Include elements that create tension, fear, and supernatural dread.",
    romance: "Create a fictional world for a romance-focused RPG. The setting should be conducive to romantic encounters and emotional storytelling.",
    historical: "Create a fictional world based on a specific historical period. Ensure historical accuracy while allowing for creative interpretation.",
    custom: state.customGenre ? `Create a fictional world for a ${state.customGenre} RPG.` : "Create a fictional world for a custom RPG setting.",
  };

  return {
    system: baseGenrePrompts[state.selectedGenre] || baseGenrePrompts.fantasy,
    user: normalize(genreInstructions[state.selectedGenre] || genreInstructions.fantasy)
  };
}

export function generateEnhancedProtagonistPrompt(state: State): Prompt {
  const baseSystemPrompt = getBaseSystemPrompt(state.selectedGenre);
  
  if (state.scenarioTemplate) {
    return {
      system: baseSystemPrompt,
      user: getTemplateCharacterPrompt(state.scenarioTemplate, "protagonist") + `

The protagonist should be:
- Gender: ${state.protagonist?.gender || "any appropriate gender"}
- Race: ${state.protagonist?.race || "any appropriate race"}

Create a character that fits naturally into the template's world and has the potential for interesting adventures.`
    };
  }

  // Fall back to original logic for non-template scenarios
  return generateBasicProtagonistPrompt(state);
}

export function generateEnhancedStartingLocationPrompt(state: State): Prompt {
  const baseSystemPrompt = getBaseSystemPrompt(state.selectedGenre);
  
  if (state.scenarioTemplate) {
    return {
      system: baseSystemPrompt,
      user: getTemplateLocationPrompt(state.scenarioTemplate) + `

World Context: ${state.world.name} - ${state.world.description}

The location should be appropriate for beginning an adventure and naturally fit within the world described above.`
    };
  }

  return generateBasicStartingLocationPrompt(state);
}

export function generateEnhancedStartingCharactersPrompt(state: State): Prompt {
  const baseSystemPrompt = getBaseSystemPrompt(state.selectedGenre);
  
  if (state.scenarioTemplate) {
    const roles = state.scenarioTemplate.characterRoles.slice(0, 5).join(", ");
    return {
      system: baseSystemPrompt,
      user: getTemplateCharacterPrompt(state.scenarioTemplate) + `

Generate exactly 5 characters that would be found in this location: ${state.locations[0]?.name || "the starting location"}

Characters should include a variety of roles such as: ${roles}

World Context: ${state.world.name} - ${state.world.description}
Location: ${state.locations[0]?.description || "See location details above"}

Each character should have a distinct personality and role that makes sense for this setting and location.`
    };
  }

  return generateBasicStartingCharactersPrompt(state);
}

export function generateEnhancedNarratePrompt(state: State, action?: string): Prompt {
  const baseSystemPrompt = getBaseSystemPrompt(state.selectedGenre);
  
  // Build the user prompt
  let userPrompt = "";
  
  // Add template context if available
  if (state.scenarioTemplate) {
    userPrompt += getTemplateNarrationContext(state.scenarioTemplate) + "\n\n";
  }

  // Add current world and location context
  userPrompt += `Current World: ${state.world.name}
${state.world.description}

Current Location: ${state.locations[state.protagonist.locationIndex]?.name || "Unknown"}
${state.locations[state.protagonist.locationIndex]?.description || ""}

Characters Present:
${getCharactersInCurrentLocation(state).map(char => `- ${char.name}: ${char.biography.substring(0, 100)}...`).join('\n')}

Recent Events:
${getRecentEvents(state, 3).map(event => summarizeEvent(event)).join('\n')}`;

  // Add action if provided
  if (action) {
    userPrompt += `\n\nThe protagonist takes this action: ${action}`;
  }

  userPrompt += `\n\nNarrate what happens next. Keep the narration engaging, maintain consistency with the world and characters, and advance the story meaningfully.`;

  return {
    system: `${baseSystemPrompt}

Important: When mentioning character names in your narration, surround them with double asterisks like **Character Name**. This helps the system track which characters are being referenced.

Content Guidelines:
- Sexual content level: ${state.sexualContentLevel}
- Violent content level: ${state.violentContentLevel}`,
    user: normalize(userPrompt)
  };
}

// Helper functions
function getBaseSystemPrompt(genre: string): string {
  const genreSystemPrompts = {
    fantasy: "You are the game master of a text-based fantasy role-playing game set in a world of magic, mythical creatures, and medieval adventure.",
    scifi: "You are the game master of a text-based science fiction role-playing game set in a futuristic world with advanced technology, space travel, and alien civilizations.",
    modern: "You are the game master of a text-based modern role-playing game set in contemporary times with realistic scenarios and characters.",
    horror: "You are the game master of a text-based horror role-playing game focused on creating suspenseful, frightening, and atmospheric experiences.",
    romance: "You are the game master of a text-based romance role-playing game focused on relationships, emotional connections, and romantic storylines.",
    historical: "You are the game master of a text-based historical role-playing game set in a specific time period with accurate historical context and details.",
    custom: "You are the game master of a text-based role-playing game. Adapt your style and content to match the custom setting and genre specified in the game context.",
  };

  return genreSystemPrompts[genre as keyof typeof genreSystemPrompts] || genreSystemPrompts.fantasy;
}

function normalize(text: string): string {
  const singleNewline = /(?<!\n)\n(?!\n)/g;
  return text.replaceAll(singleNewline, " ").trim();
}

function getCharactersInCurrentLocation(state: State) {
  const currentLocation = state.protagonist.locationIndex;
  return state.characters.filter(char => char.locationIndex === currentLocation);
}

function getRecentEvents(state: State, count: number) {
  return state.events.slice(-count);
}

function summarizeEvent(event: any): string {
  switch (event.type) {
    case "action":
      return `Action: ${event.action}`;
    case "narration":
      return `Narration: ${event.text.substring(0, 100)}...`;
    case "character_introduction":
      return `Character introduced`;
    case "location_change":
      return `Location changed`;
    default:
      return "Unknown event";
  }
}

// Fallback functions for non-template scenarios (simplified versions)
function generateBasicProtagonistPrompt(state: State): Prompt {
  return {
    system: getBaseSystemPrompt(state.selectedGenre),
    user: normalize(`Generate a ${state.selectedGenre} protagonist character with name, gender, race, and biography.`)
  };
}

function generateBasicStartingLocationPrompt(state: State): Prompt {
  return {
    system: getBaseSystemPrompt(state.selectedGenre),
    user: normalize(`Generate a starting location for a ${state.selectedGenre} adventure.`)
  };
}

function generateBasicStartingCharactersPrompt(state: State): Prompt {
  return {
    system: getBaseSystemPrompt(state.selectedGenre),
    user: normalize(`Generate 5 characters for a ${state.selectedGenre} setting.`)
  };
}