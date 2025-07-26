// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as schemas from "./schemas";
import type { State, Character, CharacterBook } from "./state";

export interface Prompt {
  system: string;
  user: string;
}

function normalize(text: string): string {
  // Normalize prompt text by collapsing single newlines.
  // This allows for cleaner-looking strings in code,
  // while still producing regular single-line prompts.
  const singleNewline = /(?<!\n)\n(?!\n)/g;
  return text.replaceAll(singleNewline, " ").trim();
}

function makePrompt(userPrompt: string, genre: string = "fantasy", customGenre?: string, state?: State): Prompt {
  const genreSystemPrompts = {
    fantasy: "You are the game master of a text-based fantasy role-playing game set in a world of magic, mythical creatures, and medieval adventure. Focus on wonder, discovery, heroic journeys, and the interplay between magic and mortal concerns.",
    scifi: "You are the game master of a text-based science fiction role-playing game set in a futuristic world with advanced technology, space travel, and alien civilizations. Emphasize scientific possibilities, technological ethics, exploration of the unknown, and the impact of innovation on society.",
    modern: "You are the game master of a text-based modern role-playing game set in contemporary times with realistic scenarios and characters. Focus on authentic human experiences, current social dynamics, personal growth, and relatable contemporary challenges.",
    horror: "You are the game master of a text-based horror role-playing game focused on creating suspenseful, frightening, and psychologically engaging experiences. Build atmospheric tension through environmental storytelling, psychological depth, and the gradual revelation of disturbing truths.",
    romance: "You are the game master of a text-based romance role-playing game focused on relationships, emotional connections, and romantic development. Emphasize character chemistry, emotional authenticity, meaningful relationship progression, and intimate character moments.",
    historical: "You are the game master of a text-based historical role-playing game set in a specific time period with accurate historical context and cultural details. Maintain period authenticity while creating compelling personal narratives that reflect the era's social dynamics.",
    custom: customGenre 
      ? `You are the game master of a text-based ${customGenre} role-playing game. Thoroughly adapt your approach to match the unique setting, themes, atmosphere, and storytelling conventions of ${customGenre}. Maintain genre authenticity while creating engaging narratives.`
      : "You are the game master of a text-based role-playing game. Adapt your style and content to match the custom setting and genre specified in the game context, ensuring thematic consistency and authentic storytelling.",
  };

  let systemPrompt = genreSystemPrompts[genre as keyof typeof genreSystemPrompts] || genreSystemPrompts.fantasy;
  
  // Add custom genre enhancements if available
  if (genre === "custom" && customGenre && state) {
    const genreEnhancements = enhanceCustomGenrePrompts(customGenre);
    systemPrompt += ` ${genreEnhancements.systemPromptAddition}`;
  }
  
  // Add content level guidance if state is provided
  if (state) {
    let contentGuidance = "";
    
    // Sexual content guidance
    if (state.sexualContentLevel === "explicit") {
      contentGuidance += " Handle mature romantic and intimate content with appropriate detail while maintaining narrative quality.";
    } else if (state.sexualContentLevel === "actively_explicit") {
      contentGuidance += " Include mature romantic and intimate content as naturally appropriate to the story, with explicit detail when narratively justified.";
    } else {
      contentGuidance += " Keep romantic content tasteful and story-appropriate.";
    }
    
    // Violent content guidance
    if (state.violentContentLevel === "graphic") {
      contentGuidance += " Depict violence and conflict with realistic consequences and appropriate detail.";
    } else if (state.violentContentLevel === "pervasive") {
      contentGuidance += " Violence is a significant element - portray conflicts and their consequences with full dramatic impact.";
    } else {
      contentGuidance += " Handle violence tastefully, focusing on dramatic impact rather than graphic detail.";
    }
    
    systemPrompt += contentGuidance;
  }

  return {
    system: systemPrompt,
    user: normalize(userPrompt),
  };
}

export function generateWorldPrompt(state: State): Prompt {
  // Enhanced genre instructions with custom content level awareness
  const genreInstructions = {
    fantasy: "Create a fictional world for a fantasy adventure RPG with magic, mythical creatures, and medieval settings. The world should feature rich magical systems and diverse fantastical societies.",
    scifi: "Create a fictional world for a science fiction RPG with advanced technology, space travel, and alien civilizations. Focus on technological innovation, scientific possibilities, and interstellar culture.",
    modern: "Create a fictional world for a modern-day RPG set in contemporary times. Ground the setting in realistic contemporary context while allowing for dramatic possibilities.",
    horror: "Create a fictional world for a horror RPG with dark, foreboding atmosphere. Build a setting where dread and supernatural elements can naturally emerge from the environment itself.",
    romance: "Create a fictional world for a romance-focused RPG. Design settings that naturally facilitate emotional connections, intimate moments, and relationship development.",
    historical: "Create a fictional world based on a specific historical period. Maintain period authenticity while creating space for compelling personal narratives and character development.",
    custom: state.customGenre ? `Create a fictional world for a ${state.customGenre} RPG.` : "Create a fictional world for a custom RPG setting.",
  };

  const genre = state.selectedGenre;
  let instruction = genreInstructions[genre] || genreInstructions.fantasy;
  
  // Advanced scenario template integration with fallback handling
  if (state.scenarioTemplate) {
    // Use dedicated world prompt if available
    if (state.scenarioTemplate.worldPrompt && state.scenarioTemplate.worldPrompt.trim()) {
      instruction = state.scenarioTemplate.worldPrompt;
    } else {
      // Enhance base instruction with scenario elements
      instruction += ` The world should support this scenario: ${state.scenarioTemplate.description}`;
    }
    
    // Additional scenario context for world building
    if (state.scenarioTemplate.tags && state.scenarioTemplate.tags.length > 0) {
      instruction += ` Incorporate these thematic elements naturally into the world: ${state.scenarioTemplate.tags.join(", ")}.`;
    }
    
    // Location type preferences for world design
    if (state.scenarioTemplate.locationTypes && state.scenarioTemplate.locationTypes.length > 0) {
      instruction += ` The world should naturally contain locations such as: ${state.scenarioTemplate.locationTypes.join(", ")}.`;
    }
  }
  
  // Enhanced custom content level integration
  let contentGuidance = "";
  
  // Sexual content level considerations
  if (state.sexualContentLevel === "explicit" || state.sexualContentLevel === "actively_explicit") {
    contentGuidance += " The world should accommodate mature romantic and intimate scenarios naturally within its cultural context.";
  } else if (state.scenarioTemplate?.defaultSexualContent === "explicit" || state.scenarioTemplate?.defaultSexualContent === "actively_explicit") {
    contentGuidance += " The world's culture should allow for mature romantic expressions and intimate relationships.";
  }
  
  // Violent content level considerations  
  if (state.violentContentLevel === "graphic" || state.violentContentLevel === "pervasive") {
    contentGuidance += " The world should have realistic consequences for conflict and allow for intense dramatic confrontations.";
  } else if (state.scenarioTemplate?.defaultViolentContent === "graphic" || state.scenarioTemplate?.defaultViolentContent === "pervasive") {
    contentGuidance += " The world should accommodate serious conflicts and their realistic consequences.";
  }
  
  if (contentGuidance) {
    instruction += contentGuidance;
  }
  
  // Enhanced custom genre handling
  let customGenreEnhancements = "";
  if (genre === "custom" && state.customGenre) {
    const genreEnhancements = enhanceCustomGenrePrompts(state.customGenre);
    customGenreEnhancements = ` ${genreEnhancements.worldGuidance}`;
  }
  
  // Character relationship system integration
  let relationshipWorldGuidance = "";
  if (state.protagonist.relationships && Object.keys(state.protagonist.relationships).length > 0) {
    relationshipWorldGuidance = " Design the world to support complex character relationships and social dynamics that can evolve meaningfully over time.";
  }
  
  // Multi-character mode considerations
  let multiCharacterGuidance = "";
  if (state.multiCharacterMode) {
    multiCharacterGuidance = " The world should facilitate group dynamics and support multiple character perspectives and storylines.";
  }
  
  // Enhanced race integration with cultural depth
  let raceIntegration = "";
  const allRaces = ["humans", "elves", "dwarves"]; // Default fantasy races
  
  if (state.customRaces && state.customRaces.length > 0) {
    allRaces.push(...state.customRaces);
    raceIntegration = ` The world is populated by diverse races including: ${allRaces.join(", ")}. Each race should have distinct cultural contributions to the world's history and current society.`;
  } else if (genre === "fantasy") {
    raceIntegration = ` The world features the traditional fantasy races of ${allRaces.join(", ")}, each with their own rich cultural heritage and unique role in the world's ecosystem.`;
  }
  
  // Imported character considerations
  let importedCharacterGuidance = "";
  if (state.importedCharacters && state.importedCharacters.length > 0) {
    importedCharacterGuidance = " The world should be flexible enough to accommodate diverse character backgrounds and origins from various settings.";
  }

  const finalInstruction = `${instruction}${customGenreEnhancements}${relationshipWorldGuidance}${multiCharacterGuidance}${raceIntegration}${importedCharacterGuidance}`;

  return makePrompt(`
${finalInstruction}

Return the world's name and a short description (100 words maximum) as a JSON object.
Focus on creating a unique, evocative setting that avoids clichéd fantasy tropes.
The world name should be memorable and reflect the setting's key characteristics.
The description should establish the world's defining features, atmosphere, and potential for adventure.

${state.scenarioTemplate ? `Scenario Requirements: Ensure the world naturally supports the following scenario: "${state.scenarioTemplate.description}"` : ""}
`, genre, state.customGenre, state);
}

export function generateProtagonistPrompt(state: State): Prompt {
  // If protagonist has imported character data, use that
  if (state.protagonist.isImported && state.protagonist.tavernCard) {
    const card = state.protagonist.tavernCard.data;
    let scenarioContext = "";
    
    if (state.scenarioTemplate) {
      scenarioContext = `\nScenario Context: ${state.scenarioTemplate.description}`;
    }
    
    return makePrompt(`
The protagonist is an imported character: ${card.name}.

Character Description: ${card.description}
Personality: ${card.personality}
${card.scenario ? `Character Scenario: ${card.scenario}` : ""}
${scenarioContext}

Adapt this character to fit the world of ${state.world.name}.
${state.world.description}

Return a brief character summary as a JSON object, maintaining the character's core personality while fitting the world setting and scenario requirements.
`, state.selectedGenre, state.customGenre, state);
  }

  const raceDescription = state.protagonist.race === "custom" && state.protagonist.customRace 
    ? state.protagonist.customRace 
    : state.protagonist.race;

  let scenarioGuidance = "";
  if (state.scenarioTemplate) {
    scenarioGuidance = `\nThis character should fit the scenario: ${state.scenarioTemplate.description}`;
    if (state.scenarioTemplate.characterRoles && state.scenarioTemplate.characterRoles.length > 0) {
      scenarioGuidance += `\nConsider these character roles: ${state.scenarioTemplate.characterRoles.join(", ")}.`;
    }
  }

  return makePrompt(`
Create a ${state.protagonist.gender} ${raceDescription} protagonist
for a ${state.selectedGenre} adventure set in the world of ${state.world.name}.

${state.world.description}
${scenarioGuidance}

Return the character description as a JSON object. Include a short biography (100 words maximum).
${state.protagonist.appearance ? `Character appearance notes: ${state.protagonist.appearance}` : ""}
`, state.selectedGenre, state.customGenre, state);
}

export function generateStartingLocationPrompt(state: State): Prompt {
  const availableLocationTypes: string[] = [...Object.values(schemas.LocationType.enum)];
  if (state.customLocationTypes && state.customLocationTypes.length > 0) {
    availableLocationTypes.push(...state.customLocationTypes);
  }
  
  // Enhanced scenario template location types
  if (state.scenarioTemplate?.locationTypes) {
    availableLocationTypes.push(...state.scenarioTemplate.locationTypes.filter(lt => !availableLocationTypes.includes(lt)));
  }

  let scenarioGuidance = "";
  if (state.scenarioTemplate) {
    scenarioGuidance = `\nScenario context: ${state.scenarioTemplate.description}`;
    if (state.scenarioTemplate.locationTypes && state.scenarioTemplate.locationTypes.length > 0) {
      scenarioGuidance += `\nPreferred location types for this scenario: ${state.scenarioTemplate.locationTypes.join(", ")}.`;
    }
  }

  return makePrompt(`
Create a starting location for a ${state.selectedGenre} adventure set in the world of ${state.world.name}.

${state.world.description}
${scenarioGuidance}

Return the name and type of the location, and a short description (100 words maximum), as a JSON object.
Choose from the following location types: ${availableLocationTypes.join(", ")}

The location should be appropriate for beginning the adventure and allow for meaningful character interactions.
`, state.selectedGenre, state.customGenre, state);
}

export function generateStartingCharactersPrompt(state: State): Prompt {
  const location = state.locations[state.protagonist.locationIndex];
  
  // Check if we have imported characters to potentially use
  const importedChars = state.importedCharacters || [];
  const hasImportedCharacters = importedChars.length > 0;
  
  let scenarioCharacterGuidance = "";
  if (state.scenarioTemplate) {
    scenarioCharacterGuidance = `\nScenario context: ${state.scenarioTemplate.description}`;
    if (state.scenarioTemplate.characterRoles && state.scenarioTemplate.characterRoles.length > 0) {
      scenarioCharacterGuidance += `\nConsider including characters with these roles: ${state.scenarioTemplate.characterRoles.join(", ")}.`;
    }
  }
  
  // Enhanced character relationship foundations
  let relationshipGuidance = "";
  if (state.protagonist.relationships && Object.keys(state.protagonist.relationships).length > 0) {
    relationshipGuidance = `\nProtagonist has existing relationships to consider: ${Object.entries(state.protagonist.relationships).map(([name, rel]) => `${name} (${rel})`).join(", ")}.`;
  }

  return makePrompt(`
This is the start of a ${state.selectedGenre} adventure set in the world of ${state.world.name}. ${state.world.description}

The protagonist is ${state.protagonist.name}. ${state.protagonist.biography}
${state.protagonist.personality ? `Protagonist personality: ${state.protagonist.personality}` : ""}
${relationshipGuidance}

${state.protagonist.name} is about to enter ${location.name}. ${location.description}
${scenarioCharacterGuidance}

Create 5 characters that ${state.protagonist.name} might encounter at ${location.name}.
Return the character descriptions as an array of JSON objects.
Include a short biography (100 words maximum) for each character.
Consider how these characters might relate to the protagonist and each other.

${hasImportedCharacters ? "Note: You may incorporate some of the imported characters if they fit the location and scenario." : ""}
`, state.selectedGenre, state.customGenre, state);
}

function makeMainPrompt(prompt: string, state: State): Prompt {
  const context = state.events
    .map((event) => {
      if (event.type === "narration") {
        return event.text;
      } else if (event.type === "character_introduction") {
        // Implied in the narration.
        return null;
      } else if (event.type === "location_change") {
        // Also implied in the narration, but used to structure the story and describe available characters.
        const location = state.locations[event.locationIndex];
        return normalize(`
-----

LOCATION CHANGE

${state.protagonist.name} is entering ${location.name}. ${location.description}

The following characters are present at ${location.name}:

${event.presentCharacterIndices
  .map((index) => {
    const character = state.characters[index];
    const characterInfo = [
      `${character.name}: ${character.biography}`,
      character.personality ? `Personality: ${character.personality}` : "",
      character.voicePattern ? `Speech pattern: ${character.voicePattern}` : "",
      character.relationships && state.protagonist.relationships?.[character.name] 
        ? `Relationship with ${state.protagonist.name}: ${state.protagonist.relationships[character.name]}` : ""
    ].filter(Boolean).join(" ");
    return characterInfo;
  })
  .join("\n\n")}

-----
`);
      }
    })
    .filter((text) => !!text)
    .join("\n\n");

  // Enhanced character book context with relevance filtering
  let characterBookContext = "";
  if (state.enableCharacterBooks) {
    const currentLocation = state.locations[state.protagonist.locationIndex];
    const presentCharacters = state.events
      .filter(event => event.type === "location_change" && event.locationIndex === state.protagonist.locationIndex)
      .flatMap(event => (event as any).presentCharacterIndices || [])
      .map(index => state.characters[index])
      .filter(char => char.characterBook?.entries);
    
    // Include protagonist's character book if available
    if (state.protagonist.characterBook?.entries) {
      presentCharacters.push(state.protagonist);
    }
    
    const relevantEntries = presentCharacters
      .flatMap(char => {
        if (!char.characterBook?.entries) return [];
        
        return char.characterBook.entries
          .filter(entry => {
            if (!entry.enabled) return false;
            
            // Check if entry is relevant to current context
            const contextText = `${context} ${currentLocation?.name} ${currentLocation?.description}`.toLowerCase();
            const isRelevant = entry.keys.some(key => 
              contextText.includes(key.toLowerCase()) ||
              (entry.secondary_keys && entry.secondary_keys.some(skey => contextText.includes(skey.toLowerCase())))
            );
            
            return isRelevant || entry.constant; // Include constant entries
          })
          .map(entry => `${char.name}: ${entry.content}`);
      });
    
    if (relevantEntries.length > 0) {
      characterBookContext = `\n\nCharacter Context:\n${relevantEntries.join("\n\n")}`;
    }
  }
  
  // Enhanced scenario template integration
  let scenarioContext = "";
  if (state.scenarioTemplate) {
    scenarioContext = `\n\nScenario Goals: ${state.scenarioTemplate.description}`;
    if (state.scenarioTemplate.tags && state.scenarioTemplate.tags.length > 0) {
      scenarioContext += `\nThematic Elements: ${state.scenarioTemplate.tags.join(", ")}`;
    }
  }
  
  // Character relationship dynamics context
  let relationshipContext = "";
  if (state.protagonist.relationships && Object.keys(state.protagonist.relationships).length > 0) {
    const activeRelationships = Object.entries(state.protagonist.relationships)
      .filter(([name]) => state.characters.some(char => char.name === name))
      .map(([name, relationship]) => `${name}: ${relationship}`)
      .join(", ");
      
    if (activeRelationships) {
      relationshipContext = `\n\nActive Relationships: ${activeRelationships}`;
    }
  }

  return makePrompt(`
This is a ${state.selectedGenre} adventure RPG set in the world of ${state.world.name}. ${state.world.description}

The protagonist (who you should refer to as "you" in your narration, as the adventure happens from their perspective)
is ${state.protagonist.name}. ${state.protagonist.biography}
${state.protagonist.personality ? `Protagonist personality: ${state.protagonist.personality}` : ""}${relationshipContext}${scenarioContext}

Here is what has happened so far:

${context}${characterBookContext}



${normalize(prompt)}
`, state.selectedGenre, state.customGenre, state);
}

export function narratePrompt(state: State, action?: string): Prompt {
  // Genre-specific narrative guidance
  const genreGuidance = {
    fantasy: "Use rich descriptions of magical elements and fantastical settings. Include sensory details about mystical phenomena.",
    scifi: "Focus on technological details and futuristic environments. Describe advanced technologies naturally within the narrative.",
    modern: "Keep descriptions grounded and realistic. Focus on contemporary dialogue and relatable situations.",
    horror: "Build tension through atmosphere and pacing. Use subtle hints of dread rather than explicit gore.",
    romance: "Emphasize emotional undertones and character connections. Pay attention to subtle romantic cues and chemistry.",
    historical: "Maintain period-appropriate language and cultural details. Ensure authenticity in social interactions.",
    custom: state.customGenre ? `Adapt the narrative style to match the ${state.customGenre} genre conventions.` : "Adapt the narrative style to the custom setting.",
  };
  
  const currentGuidance = genreGuidance[state.selectedGenre] || genreGuidance.fantasy;
  
  // Relationship-aware narrative instructions
  let relationshipGuidance = "";
  if (state.protagonist.relationships && Object.keys(state.protagonist.relationships).length > 0) {
    relationshipGuidance = "\nConsider existing character relationships when writing dialogue and interactions. Reflect established dynamics in character behavior.";
  }

  return makeMainPrompt(
    `
${action ? `The protagonist (${state.protagonist.name}) has chosen to do the following: ${action}.` : ""}
Narrate what happens next, using novel-style prose, in the present tense.
Prioritize dialogue over descriptions.
Do not mention more than 2 different characters in your narration.
Refer to characters using their first names.
Make all character names bold by surrounding them with double asterisks (**Name**).
Write 2-3 paragraphs (no more than 200 words in total).
Stop when it is the protagonist's turn to speak or act.
Remember to refer to the protagonist (${state.protagonist.name}) as "you" in your narration.
Do not explicitly ask the protagonist for a response at the end; they already know what is expected of them.

Genre Guidance: ${currentGuidance}${relationshipGuidance}
`,
    state,
  );
}

export function generateActionsPrompt(state: State): Prompt {
  // Genre-specific action guidance
  const genreActionGuidance = {
    fantasy: "Include magical abilities, heroic actions, and mystical interactions as appropriate.",
    scifi: "Consider technological solutions, scientific approaches, and futuristic capabilities.",
    modern: "Focus on realistic, contemporary actions and dialogue options.",
    horror: "Provide options that build tension, including investigation, caution, and survival choices.",
    romance: "Include emotionally expressive options and relationship-building choices.",
    historical: "Ensure actions are appropriate for the historical period and social context.",
    custom: state.customGenre ? `Tailor actions to fit ${state.customGenre} genre conventions.` : "Adapt actions to the custom setting.",
  };
  
  // Character relationship consideration
  let relationshipActions = "";
  const currentLocation = state.locations[state.protagonist.locationIndex];
  const recentEvents = state.events.slice(-3); // Last 3 events for context
  const presentCharacters = recentEvents
    .filter(event => event.type === "location_change")
    .flatMap(event => (event as any).presentCharacterIndices || [])
    .map(index => state.characters[index])
    .filter(char => state.protagonist.relationships?.[char.name]);
    
  if (presentCharacters.length > 0) {
    relationshipActions = `\nConsider relationship dynamics with present characters: ${presentCharacters.map(char => `${char.name} (${state.protagonist.relationships?.[char.name]})`).join(", ")}.`;
  }

  return makeMainPrompt(
    `
Suggest 3 options for what the protagonist (${state.protagonist.name}) could do or say next.
Each option should be a single, short sentence that starts with a verb.
Return the options as a JSON array of strings.

Genre Considerations: ${genreActionGuidance[state.selectedGenre] || genreActionGuidance.fantasy}${relationshipActions}
Make the options diverse - include dialogue, action, and observation/investigation choices when appropriate.
`,
    state,
  );
}

export function checkIfSameLocationPrompt(state: State): Prompt {
  return makeMainPrompt(
    `
Is the protagonist (${state.protagonist.name}) still at ${state.locations[state.protagonist.locationIndex].name}?
Answer with "yes" or "no".
`,
    state,
  );
}

export function generateNewLocationPrompt(state: State): Prompt {
  // Consider scenario template preferences for new locations
  let scenarioLocationGuidance = "";
  if (state.scenarioTemplate?.locationTypes) {
    scenarioLocationGuidance = `\nPreferred location types for this scenario: ${state.scenarioTemplate.locationTypes.join(", ")}.`;
  }
  
  // Consider character relationships for who might accompany
  let companionGuidance = "";
  if (state.protagonist.relationships && Object.keys(state.protagonist.relationships).length > 0) {
    const allies = Object.entries(state.protagonist.relationships)
      .filter(([_, relationship]) => relationship.toLowerCase().includes("friend") || relationship.toLowerCase().includes("ally") || relationship.toLowerCase().includes("companion"))
      .map(([name]) => name);
    
    if (allies.length > 0) {
      companionGuidance = `\nCharacters likely to accompany based on relationships: ${allies.join(", ")}.`;
    }
  }

  return makeMainPrompt(
    `
The protagonist (${state.protagonist.name}) has left ${state.locations[state.protagonist.locationIndex].name}.
Return the name and type of their new location, and a short description (100 words maximum), as a JSON object.
Also include the names of the characters that are going to accompany ${state.protagonist.name} there, if any.${scenarioLocationGuidance}${companionGuidance}

Consider the narrative flow and ensure the new location advances the story appropriately.
`,
    state,
  );
}

// Must be called *before* adding the location change event to the state!
export function generateNewCharactersPrompt(state: State, accompanyingCharacters: string[]): Prompt {
  const location = state.locations[state.protagonist.locationIndex];
  
  // Enhanced scenario template integration for character roles
  let scenarioCharacterGuidance = "";
  if (state.scenarioTemplate) {
    scenarioCharacterGuidance = `\nScenario context: ${state.scenarioTemplate.description}`;
    if (state.scenarioTemplate.characterRoles && state.scenarioTemplate.characterRoles.length > 0) {
      scenarioCharacterGuidance += `\nConsider including characters with these roles: ${state.scenarioTemplate.characterRoles.join(", ")}.`;
    }
  }
  
  // Relationship development opportunities
  let relationshipGuidance = "";
  const existingRelationships = Object.keys(state.protagonist.relationships || {});
  if (existingRelationships.length > 0) {
    relationshipGuidance = `\nConsider creating characters who might develop interesting dynamics with ${state.protagonist.name}, potentially referencing existing relationships with: ${existingRelationships.join(", ")}.`;
  }

  return makeMainPrompt(
    `
The protagonist (${state.protagonist.name}) is about to enter ${location.name}. ${location.description}

${accompanyingCharacters.length > 0 ? `${state.protagonist.name} is accompanied by the following characters: ${accompanyingCharacters.join(", ")}.` : ""}${scenarioCharacterGuidance}${relationshipGuidance}

Create 5 additional, new characters that ${state.protagonist.name} might encounter at ${location.name}.
Do not reuse characters that have already appeared in the story.
Return the character descriptions as an array of JSON objects.
Include a short biography (100 words maximum) for each character.
Consider how these new characters might fit into the broader narrative and their potential relationships with existing characters.
`,
    state,
  );
}

// Utility functions for enhanced prompt system

/**
 * Filter character book entries based on contextual relevance
 */
export function filterRelevantCharacterBookEntries(
  characterBook: CharacterBook,
  context: string,
  maxEntries: number = 5
): Array<{ content: string; priority: number; name?: string }> {
  if (!characterBook.entries) return [];
  
  const contextLower = context.toLowerCase();
  const relevantEntries = characterBook.entries
    .filter(entry => entry.enabled)
    .map(entry => {
      let relevanceScore = 0;
      
      // Check primary keys
      for (const key of entry.keys) {
        if (contextLower.includes(key.toLowerCase())) {
          relevanceScore += entry.priority || 1;
        }
      }
      
      // Check secondary keys
      if (entry.secondary_keys) {
        for (const key of entry.secondary_keys) {
          if (contextLower.includes(key.toLowerCase())) {
            relevanceScore += (entry.priority || 1) * 0.5;
          }
        }
      }
      
      // Always include constant entries with base priority
      if (entry.constant) {
        relevanceScore = Math.max(relevanceScore, 0.5);
      }
      
      return {
        content: entry.content,
        priority: relevanceScore,
        name: entry.name,
        insertionOrder: entry.insertion_order,
      };
    })
    .filter(entry => entry.priority > 0)
    .sort((a, b) => {
      // Sort by priority first, then by insertion order
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.insertionOrder - b.insertionOrder;
    })
    .slice(0, maxEntries);
    
  return relevantEntries;
}

/**
 * Analyze character relationships to suggest narrative opportunities
 */
export function analyzeCharacterRelationships(state: State): {
  activeDynamics: Array<{ character: string; relationship: string; narrative_potential: string }>;
  suggestedInteractions: string[];
  conflictPotential: Array<{ characters: string[]; tension: string }>;
} {
  const activeDynamics: Array<{ character: string; relationship: string; narrative_potential: string }> = [];
  const suggestedInteractions: string[] = [];
  const conflictPotential: Array<{ characters: string[]; tension: string }> = [];
  
  if (!state.protagonist.relationships) {
    return { activeDynamics, suggestedInteractions, conflictPotential };
  }
  
  // Analyze each relationship for narrative potential
  for (const [characterName, relationship] of Object.entries(state.protagonist.relationships)) {
    const character = state.characters.find(char => char.name === characterName);
    if (!character) continue;
    
    let narrativePotential = "";
    const relLower = relationship.toLowerCase();
    
    if (relLower.includes("enemy") || relLower.includes("rival")) {
      narrativePotential = "Potential for conflict, tension, and dramatic confrontation";
      conflictPotential.push({ 
        characters: [state.protagonist.name, characterName], 
        tension: relationship 
      });
    } else if (relLower.includes("friend") || relLower.includes("ally")) {
      narrativePotential = "Opportunities for cooperation, support, and shared goals";
    } else if (relLower.includes("love") || relLower.includes("romance")) {
      narrativePotential = "Romantic tension, emotional development, and intimate moments";
    } else if (relLower.includes("mentor") || relLower.includes("teacher")) {
      narrativePotential = "Learning opportunities, wisdom sharing, and character growth";
    } else if (relLower.includes("family") || relLower.includes("sibling") || relLower.includes("parent")) {
      narrativePotential = "Deep emotional connections, personal history, and family dynamics";
    } else {
      narrativePotential = "Complex relationship with room for development and surprise";
    }
    
    activeDynamics.push({
      character: characterName,
      relationship,
      narrative_potential: narrativePotential,
    });
    
    // Generate interaction suggestions
    if (relLower.includes("friend")) {
      suggestedInteractions.push(`Share a moment of camaraderie with ${characterName}`);
    }
    if (relLower.includes("rival")) {
      suggestedInteractions.push(`Engage in competitive dialogue with ${characterName}`);
    }
    if (relLower.includes("mentor")) {
      suggestedInteractions.push(`Seek guidance or wisdom from ${characterName}`);
    }
  }
  
  // Look for potential multi-character conflicts
  const relationships = Object.entries(state.protagonist.relationships);
  for (let i = 0; i < relationships.length; i++) {
    for (let j = i + 1; j < relationships.length; j++) {
      const [char1, rel1] = relationships[i];
      const [char2, rel2] = relationships[j];
      
      // Check for conflicting loyalties
      if ((rel1.toLowerCase().includes("friend") && rel2.toLowerCase().includes("enemy")) ||
          (rel1.toLowerCase().includes("ally") && rel2.toLowerCase().includes("rival"))) {
        conflictPotential.push({
          characters: [char1, char2],
          tension: "Conflicting loyalties and divided allegiances",
        });
      }
    }
  }
  
  return { activeDynamics, suggestedInteractions, conflictPotential };
}

/**
 * Generate genre-appropriate scenario goal tracking
 */
export function trackScenarioGoals(state: State): {
  currentGoals: string[];
  completedMilestones: string[];
  suggestedNextSteps: string[];
} {
  const currentGoals: string[] = [];
  const completedMilestones: string[] = [];
  const suggestedNextSteps: string[] = [];
  
  if (!state.scenarioTemplate) {
    return { currentGoals, completedMilestones, suggestedNextSteps };
  }
  
  // Extract goals from scenario description
  const scenarioDesc = state.scenarioTemplate.description.toLowerCase();
  
  // Basic goal detection patterns
  const goalPatterns = [
    { pattern: /find|discover|locate|search/, goal: "Discovery/Investigation" },
    { pattern: /defeat|overcome|conquer|destroy/, goal: "Conflict Resolution" },
    { pattern: /save|rescue|protect|help/, goal: "Heroic Action" },
    { pattern: /learn|understand|master|study/, goal: "Knowledge/Skill Development" },
    { pattern: /build|create|establish|found/, goal: "Construction/Creation" },
    { pattern: /travel|journey|reach|arrive/, goal: "Exploration/Travel" },
    { pattern: /unite|gather|assemble|rally/, goal: "Alliance Building" },
  ];
  
  for (const { pattern, goal } of goalPatterns) {
    if (pattern.test(scenarioDesc)) {
      currentGoals.push(goal);
    }
  }
  
  // Genre-specific goal suggestions
  const genreGoals = {
    fantasy: ["Master magical abilities", "Defeat the ancient evil", "Unite the kingdoms"],
    scifi: ["Discover alien technology", "Prevent galactic war", "Explore new worlds"],
    modern: ["Solve the mystery", "Build relationships", "Achieve personal growth"],
    horror: ["Survive the nightmare", "Uncover the truth", "Escape the danger"],
    romance: ["Find true love", "Overcome relationship obstacles", "Create meaningful connections"],
    historical: ["Navigate historical events", "Maintain period authenticity", "Influence history"],
    custom: ["Achieve scenario-specific objectives"],
  };
  
  const genreSpecificGoals = genreGoals[state.selectedGenre] || genreGoals.custom;
  suggestedNextSteps.push(...genreSpecificGoals);
  
  // Analyze progress based on events
  const narrativeEvents = state.events.filter(event => event.type === "narration");
  if (narrativeEvents.length > 0) {
    completedMilestones.push("Story initiated");
  }
  if (narrativeEvents.length > 5) {
    completedMilestones.push("Character development established");
  }
  if (state.locations.length > 1) {
    completedMilestones.push("World exploration begun");
  }
  if (state.characters.length > 2) {
    completedMilestones.push("Character network established");
  }
  
  return { currentGoals, completedMilestones, suggestedNextSteps };
}

/**
 * Enhanced custom genre handling with comprehensive pattern detection
 */
export function enhanceCustomGenrePrompts(customGenre: string): {
  systemPromptAddition: string;
  narrativeGuidance: string;
  characterGuidance: string;
  worldGuidance: string;
} {
  const genreLower = customGenre.toLowerCase();
  
  // Detect genre characteristics with expanded patterns
  let systemPromptAddition = "";
  let narrativeGuidance = "";
  let characterGuidance = "";
  let worldGuidance = "";
  
  // Cyberpunk detection
  if (genreLower.includes("cyber") || genreLower.includes("punk") || 
      genreLower.includes("neo-tokyo") || genreLower.includes("dystopian tech")) {
    systemPromptAddition = "Focus on high-tech, low-life themes with corporate dystopia, digital rebellion, and cybernetic enhancement.";
    narrativeGuidance = "Emphasize technological integration, hacking culture, corporate espionage, and the tension between human and machine.";
    characterGuidance = "Include hackers, corporate agents, augmented individuals, and tech-savvy rebels fighting against systemic oppression.";
    worldGuidance = "Create a neon-lit dystopian urban environment where advanced technology coexists with social decay and corporate control.";
  }
  // Steampunk detection
  else if (genreLower.includes("steam") || genreLower.includes("victorian") || 
           genreLower.includes("clockwork") || genreLower.includes("brass")) {
    systemPromptAddition = "Victorian-era aesthetic with anachronistic steam-powered technology, brass machinery, and industrial revolution themes.";
    narrativeGuidance = "Describe elaborate mechanical contraptions, airship travel, and Victorian social customs adapted to fantastic technology.";
    characterGuidance = "Include inventors, airship pilots, mechanical engineers, and Victorian-era adventurers with access to impossible technology.";
    worldGuidance = "Blend Victorian elegance and industrial aesthetics with fantastical steam-powered inventions and clockwork automatons.";
  }
  // Post-apocalyptic detection
  else if (genreLower.includes("apocal") || genreLower.includes("wasteland") || 
           genreLower.includes("survivor") || genreLower.includes("fallout") || genreLower.includes("nuclear")) {
    systemPromptAddition = "Post-catastrophe survival setting with scarce resources, dangerous environments, and the struggle to rebuild civilization.";
    narrativeGuidance = "Focus on resource scarcity, environmental hazards, community building, and the tension between survival and morality.";
    characterGuidance = "Include hardened survivors, community leaders, raiders, scavengers, and those trying to preserve or restore the old world.";
    worldGuidance = "Create a dangerous wasteland with remnants of the old world, new settlements, and environmental challenges that shape daily life.";
  }
  // Urban fantasy detection
  else if ((genreLower.includes("urban") && genreLower.includes("fantasy")) || 
           genreLower.includes("modern magic") || genreLower.includes("supernatural")) {
    systemPromptAddition = "Contemporary urban setting with hidden magical elements, supernatural beings, and the intersection of modern life with ancient powers.";
    narrativeGuidance = "Blend everyday modern scenarios with magical realism, hidden supernatural communities, and the challenge of keeping magic secret.";
    characterGuidance = "Include modern people discovering magical abilities, supernatural beings adapting to contemporary life, and those who bridge both worlds.";
    worldGuidance = "Create a modern urban environment where magical locations exist alongside mundane spaces, and supernatural societies operate in secret.";
  }
  // Space opera detection
  else if (genreLower.includes("space") && (genreLower.includes("opera") || genreLower.includes("empire") || genreLower.includes("galactic"))) {
    systemPromptAddition = "Epic space-faring civilization with galactic politics, advanced technologies, and grand-scale conflicts across star systems.";
    narrativeGuidance = "Emphasize interstellar politics, exotic alien cultures, space battles, and the scale of galactic civilization.";
    characterGuidance = "Include space pilots, alien diplomats, galactic politicians, rebels, and explorers dealing with cosmic-scale challenges.";
    worldGuidance = "Create a galaxy-spanning civilization with diverse worlds, alien species, and political complexities that drive interstellar conflict.";
  }
  // Western detection
  else if (genreLower.includes("western") || genreLower.includes("frontier") || 
           genreLower.includes("cowboy") || genreLower.includes("saloon")) {
    systemPromptAddition = "American frontier setting with rugged individualism, lawless territories, and the clash between civilization and wilderness.";
    narrativeGuidance = "Focus on themes of justice, survival, honor, and the tension between law and personal code in untamed lands.";
    characterGuidance = "Include gunfighters, sheriffs, outlaws, settlers, and native peoples navigating the challenges of frontier life.";
    worldGuidance = "Create a frontier environment with small towns, vast wilderness, and the constant presence of danger and opportunity.";
  }
  // Superhero detection
  else if (genreLower.includes("super") || genreLower.includes("hero") || 
           genreLower.includes("comic") || genreLower.includes("powered")) {
    systemPromptAddition = "Modern or near-future setting where individuals possess extraordinary abilities and face moral choices about their power.";
    narrativeGuidance = "Balance action sequences with personal drama, moral dilemmas, and the responsibility that comes with great power.";
    characterGuidance = "Include powered individuals, ordinary people affected by heroes, villains with complex motivations, and support networks.";
    worldGuidance = "Create a world where extraordinary abilities exist within an otherwise familiar setting, raising questions about power and responsibility.";
  }
  // Noir detection
  else if (genreLower.includes("noir") || genreLower.includes("detective") || 
           genreLower.includes("mystery") || genreLower.includes("crime")) {
    systemPromptAddition = "Dark, atmospheric setting focused on crime, moral ambiguity, and the seedy underbelly of society.";
    narrativeGuidance = "Emphasize shadow and atmosphere, morally complex characters, and mysteries that reveal deeper corruption.";
    characterGuidance = "Include private investigators, criminals with codes of honor, corrupt officials, and victims caught in webs of deceit.";
    worldGuidance = "Create an urban environment where crime and corruption lurk beneath a veneer of respectability, and truth is always complicated.";
  }
  // Slice of life detection
  else if (genreLower.includes("slice") || genreLower.includes("daily") || 
           genreLower.includes("mundane") || genreLower.includes("realistic")) {
    systemPromptAddition = "Focus on ordinary life experiences, personal relationships, and finding meaning in everyday situations.";
    narrativeGuidance = "Emphasize character development, realistic dialogue, and the significance found in small moments and personal growth.";
    characterGuidance = "Include relatable people dealing with common challenges like work, relationships, family, and personal aspirations.";
    worldGuidance = "Create a realistic, contemporary setting where the drama comes from personal relationships and life's ordinary challenges.";
  }
  // Generic custom handling with enhanced analysis
  else {
    // Attempt to extract meaningful elements from the custom genre
    const genreWords = customGenre.split(/\s+|[-_]/).filter(word => word.length > 2);
    const thematicElements = genreWords.join(", ");
    
    systemPromptAddition = `Adapt to the unique themes and conventions of ${customGenre}, emphasizing its distinctive elements and atmosphere.`;
    narrativeGuidance = `Maintain consistency with ${customGenre} genre expectations while developing authentic ${thematicElements} themes.`;
    characterGuidance = `Create characters that naturally fit the ${customGenre} setting and embody its core values and conflicts.`;
    worldGuidance = `Build a world that authentically represents ${customGenre} aesthetics, themes, and storytelling conventions.`;
  }
  
  return { systemPromptAddition, narrativeGuidance, characterGuidance, worldGuidance };
}
