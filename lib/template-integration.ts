// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import type { State } from "./state";
import type { ScenarioTemplate } from "./state";
import { TemplateApplicator } from "./scenario-templates";

/**
 * Template Integration with Existing Systems
 * 
 * This module provides utilities for integrating scenario templates with
 * the existing prompt system, state management, and engine logic.
 */

/**
 * Apply a scenario template to the current state
 */
export function applyTemplateToState(template: ScenarioTemplate, currentState: State): Partial<State> {
  const application = TemplateApplicator.applyTemplate(template);
  
  return {
    // Update scenario template reference
    scenarioTemplate: template,
    selectedGenre: template.genre,
    
    // Update content levels if they're default values
    sexualContentLevel: application.defaultContentLevels.sexual,
    violentContentLevel: application.defaultContentLevels.violent,
    
    // Add custom races and location types to state
    customRaces: application.customRaces || [],
    customLocationTypes: application.locationTypes,
    
    // If this is being applied during world generation, update the world
    ...(currentState.view === "character" && {
      world: {
        ...currentState.world,
        description: currentState.world.description || TemplateApplicator.generateWorldDescription(template)
      }
    })
  };
}

/**
 * Get template-aware world generation prompt
 */
export function getTemplateWorldPrompt(template: ScenarioTemplate): string {
  return `Create a fictional world for a ${template.genre} RPG following this template:

Template: ${template.name}
Description: ${template.description}

World Prompt: ${template.worldPrompt}

The world should include these types of locations: ${template.locationTypes.join(", ")}
Common character roles in this world: ${template.characterRoles.join(", ")}

${template.customRaces && template.customRaces.length > 0 ? 
  `Available races/species: ${template.customRaces.join(", ")}` : 
  "Focus on standard races appropriate to the genre."
}

Create a rich, detailed world that embodies the essence of this template while allowing for creative expansion.`;
}

/**
 * Get template-aware character generation prompt
 */
export function getTemplateCharacterPrompt(template: ScenarioTemplate, role?: string): string {
  const availableRoles = role ? [role] : template.characterRoles.slice(0, 5);
  
  return `Generate a character for a ${template.genre} RPG using this template:

Template: ${template.name}
Setting: ${template.description}

Character should fit one of these roles: ${availableRoles.join(", ")}

${template.customRaces && template.customRaces.length > 0 ? 
  `Available races/species: ${template.customRaces.join(", ")}` : 
  ""
}

${template.customGenders && template.customGenders.length > 0 ? 
  `Available gender options: ${template.customGenders.join(", ")}` : 
  ""
}

The character should be well-suited to the world described in the template and fulfill their role authentically within this setting.`;
}

/**
 * Get template-aware location generation prompt
 */
export function getTemplateLocationPrompt(template: ScenarioTemplate, locationType?: string): string {
  const availableTypes = locationType ? [locationType] : template.locationTypes.slice(0, 3);
  
  return `Generate a location for a ${template.genre} RPG using this template:

Template: ${template.name}
World Context: ${template.worldPrompt}

Location should be one of these types: ${availableTypes.join(", ")}

The location should fit naturally within the world described in the template and provide interesting opportunities for roleplay and adventure.`;
}

/**
 * Get template-aware narration context
 */
export function getTemplateNarrationContext(template: ScenarioTemplate): string {
  return `Narrative Context from Template "${template.name}":
${template.description}

World Setting: ${template.worldPrompt}

Maintain consistency with this ${template.genre} setting throughout the narration.
${template.tags && template.tags.length > 0 ? 
  `Key themes to incorporate: ${template.tags.join(", ")}` : 
  ""
}`;
}

/**
 * Validate state compatibility with template
 */
export function validateStateTemplateCompatibility(state: State, template: ScenarioTemplate): {
  compatible: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check genre compatibility
  if (state.selectedGenre !== template.genre && state.selectedGenre !== "custom") {
    issues.push(`State genre "${state.selectedGenre}" doesn't match template genre "${template.genre}"`);
  }

  // Check if current characters have roles that fit the template
  if (state.characters.length > 0) {
    const templateRoles = template.characterRoles.map(r => r.toLowerCase());
    const incompatibleCharacters = state.characters.filter(char => {
      // This is a simplified check - in practice, you might want more sophisticated role matching
      return !templateRoles.some(role => 
        char.biography.toLowerCase().includes(role) ||
        char.name.toLowerCase().includes(role)
      );
    });
    
    if (incompatibleCharacters.length > 0) {
      warnings.push(`Some existing characters may not fit the template's character roles`);
    }
  }

  // Check location compatibility
  if (state.locations.length > 0) {
    const templateLocationTypes = template.locationTypes.map(t => t.toLowerCase());
    const incompatibleLocations = state.locations.filter(loc => {
      return !templateLocationTypes.some(type => 
        loc.type.toLowerCase().includes(type) ||
        type.includes(loc.type.toLowerCase())
      );
    });
    
    if (incompatibleLocations.length > 0) {
      warnings.push(`Some existing locations may not fit the template's location types`);
    }
  }

  // Check content level compatibility
  if (template.defaultSexualContent && 
      state.sexualContentLevel !== template.defaultSexualContent) {
    warnings.push(`Current sexual content level differs from template default`);
  }
  
  if (template.defaultViolentContent && 
      state.violentContentLevel !== template.defaultViolentContent) {
    warnings.push(`Current violent content level differs from template default`);
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Merge template settings with current state settings
 */
export function mergeTemplateWithState(
  template: ScenarioTemplate, 
  currentState: State,
  options: {
    overrideContentLevels?: boolean;
    overrideCustomRaces?: boolean;
    overrideLocationTypes?: boolean;
  } = {}
): Partial<State> {
  const updates: Partial<State> = {
    scenarioTemplate: template,
  };

  // Update genre if it's compatible
  if (currentState.selectedGenre === "custom" || currentState.selectedGenre === template.genre) {
    updates.selectedGenre = template.genre;
  }

  // Handle content levels
  if (options.overrideContentLevels || !currentState.sexualContentLevel) {
    updates.sexualContentLevel = template.defaultSexualContent || currentState.sexualContentLevel;
  }
  
  if (options.overrideContentLevels || !currentState.violentContentLevel) {
    updates.violentContentLevel = template.defaultViolentContent || currentState.violentContentLevel;
  }

  // Handle custom races
  if (template.customRaces && (options.overrideCustomRaces || !currentState.customRaces?.length)) {
    updates.customRaces = [...template.customRaces];
  }

  // Handle location types
  if (options.overrideLocationTypes || !currentState.customLocationTypes?.length) {
    updates.customLocationTypes = [...template.locationTypes];
  }

  return updates;
}

/**
 * Extract template from current state (for creating custom templates)
 */
export function extractTemplateFromState(state: State): Partial<ScenarioTemplate> {
  return {
    id: `custom-${Date.now()}`,
    name: state.world.name || "Custom Template",
    description: state.world.description || "A custom scenario template",
    genre: state.selectedGenre,
    worldPrompt: state.world.description || "",
    locationTypes: state.customLocationTypes || ["tavern", "market", "forest"],
    characterRoles: extractCharacterRoles(state),
    customRaces: state.customRaces?.length ? [...state.customRaces] : undefined,
    defaultSexualContent: state.sexualContentLevel,
    defaultViolentContent: state.violentContentLevel,
    tags: ["custom", "user-created"],
    creator: "User",
    version: "1.0.0"
  };
}

/**
 * Helper function to extract character roles from state
 */
function extractCharacterRoles(state: State): string[] {
  const roles = new Set<string>();
  
  // Extract roles from character biographies (simple keyword extraction)
  state.characters.forEach(char => {
    const bio = char.biography.toLowerCase();
    
    // Common role keywords
    const roleKeywords = [
      "knight", "warrior", "fighter", "guard", "soldier",
      "wizard", "mage", "sorcerer", "cleric", "priest",
      "rogue", "thief", "assassin", "spy", "scout",
      "merchant", "trader", "shopkeeper", "innkeeper",
      "noble", "lord", "lady", "king", "queen",
      "farmer", "blacksmith", "artisan", "craftsman",
      "scholar", "sage", "teacher", "student"
    ];
    
    roleKeywords.forEach(keyword => {
      if (bio.includes(keyword)) {
        roles.add(keyword);
      }
    });
  });
  
  // If no roles found, provide generic ones based on genre
  if (roles.size === 0) {
    const defaultRoles = {
      fantasy: ["adventurer", "hero", "companion"],
      scifi: ["crew member", "officer", "specialist"],
      modern: ["citizen", "professional", "individual"],
      horror: ["survivor", "investigator", "victim"],
      romance: ["romantic interest", "friend", "colleague"],
      historical: ["citizen", "resident", "local"],
      custom: ["character", "participant", "individual"]
    };
    
    return defaultRoles[state.selectedGenre] || defaultRoles.custom;
  }
  
  return Array.from(roles);
}