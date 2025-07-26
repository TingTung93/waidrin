// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as z from "zod/v4";
import type { ScenarioTemplate, Genre, SexualContentLevel, ViolentContentLevel } from "./state";
import * as schemas from "./schemas";

/**
 * Scenario Template Management System
 * 
 * This module provides utilities for creating, validating, managing, and applying
 * scenario templates to enhance the roleplay experience in Waidrin.
 */

// Extended validation schema with additional constraints
export const ScenarioTemplateValidation = schemas.ScenarioTemplate.extend({
  // Ensure worldPrompt is substantial enough to be useful
  worldPrompt: z.string().min(50).max(2000),
  // Validate array lengths to ensure useful content
  locationTypes: z.array(z.string().min(1).max(50)).min(1).max(20),
  characterRoles: z.array(z.string().min(1).max(100)).min(1).max(30),
  // Optional arrays with validation when present
  customRaces: z.array(z.string().min(1).max(50)).max(20).optional(),
  customGenders: z.array(z.string().min(1).max(30)).max(10).optional(),
  tags: z.array(z.string().min(1).max(30)).max(15).optional(),
});

// Template collection schema for managing multiple templates
export const TemplateCollection = z.object({
  version: z.string(),
  templates: z.array(ScenarioTemplateValidation),
  metadata: z.object({
    createdAt: z.string().datetime(),
    lastModified: z.string().datetime(),
    source: z.string().optional(),
  }).optional(),
});

// Template application result
export const TemplateApplicationResult = z.object({
  success: z.boolean(),
  template: ScenarioTemplateValidation.optional(),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

/**
 * Default templates for each genre
 */
export const DEFAULT_TEMPLATES: Record<Genre, ScenarioTemplate[]> = {
  fantasy: [
    {
      id: "fantasy-medieval-kingdom",
      name: "Medieval Kingdom",
      description: "A classic medieval fantasy setting with kingdoms, magic, and mythical creatures",
      genre: "fantasy",
      worldPrompt: "A medieval fantasy world where magic flows through ancient ley lines and mythical creatures roam vast kingdoms. Noble houses vie for power while ancient prophecies stir in forgotten ruins. Magic is common but respected, with wizards serving as advisors to kings and healers tending to the common folk.",
      locationTypes: ["castle", "tavern", "market", "forest", "village", "temple", "dungeon", "road"],
      characterRoles: ["knight", "wizard", "rogue", "cleric", "noble", "merchant", "innkeeper", "guard", "blacksmith", "farmer"],
      customRaces: ["elf", "dwarf", "halfling", "orc", "dragon-born"],
      customGenders: ["male", "female", "non-binary"],
      defaultSexualContent: "regular",
      defaultViolentContent: "regular",
      tags: ["medieval", "magic", "kingdoms", "classic-fantasy"],
      creator: "Waidrin",
      version: "1.0.0",
    },
    {
      id: "fantasy-dark-magic",
      name: "Dark Magic Realm",
      description: "A darker fantasy world where forbidden magic and ancient curses shape reality",
      genre: "fantasy",
      worldPrompt: "A world where dark magic has seeped into the very fabric of reality. Ancient curses bind the land, necromancers rule shadowy kingdoms, and heroes must often choose between moral compromises and certain doom. The line between good and evil blurs in this morally complex realm.",
      locationTypes: ["haunted castle", "cursed forest", "necropolis", "dark temple", "ruined city", "shadow market", "crypt", "witch's hut"],
      characterRoles: ["dark knight", "necromancer", "cursed noble", "demon hunter", "corrupted cleric", "shadow merchant", "cultist", "fallen paladin"],
      customRaces: ["tiefling", "undead", "shadow-touched", "demon-spawn", "cursed human"],
      defaultSexualContent: "regular",
      defaultViolentContent: "graphic",
      tags: ["dark-fantasy", "necromancy", "curses", "moral-ambiguity"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  scifi: [
    {
      id: "scifi-space-colony",
      name: "Space Colony",
      description: "Life aboard a frontier space colony dealing with alien contact and corporate politics",
      genre: "scifi",
      worldPrompt: "Humanity has spread across the galaxy in massive colony ships and space stations. This particular colony sits on the edge of known space, dealing with first contact situations, corporate espionage, and the challenges of life in the void. Advanced AI assists daily life while mysterious alien artifacts hint at greater cosmic mysteries.",
      locationTypes: ["command center", "hydroponics bay", "engineering deck", "docking bay", "medical bay", "cantina", "cargo hold", "observation deck"],
      characterRoles: ["captain", "engineer", "scientist", "security officer", "pilot", "medic", "trader", "diplomat", "AI specialist", "xenobiologist"],
      customRaces: ["human", "android", "genetically-modified", "alien-hybrid"],
      defaultSexualContent: "regular",
      defaultViolentContent: "regular",
      tags: ["space", "colony", "aliens", "technology"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  modern: [
    {
      id: "modern-urban-mystery",
      name: "Urban Mystery",
      description: "Modern city setting focused on investigation, mystery, and urban intrigue",
      genre: "modern",
      worldPrompt: "A contemporary urban environment where mysteries lurk beneath the surface of everyday life. Corporate conspiracies, underground networks, and hidden societies operate in the shadows of skyscrapers and busy streets. Technology is both a tool and a threat in this interconnected world.",
      locationTypes: ["office building", "apartment", "coffee shop", "police station", "nightclub", "warehouse", "subway", "park"],
      characterRoles: ["detective", "journalist", "hacker", "lawyer", "CEO", "bartender", "uber driver", "professor", "activist", "security guard"],
      customRaces: ["human"],
      defaultSexualContent: "regular",
      defaultViolentContent: "regular",
      tags: ["urban", "mystery", "investigation", "contemporary"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  horror: [
    {
      id: "horror-haunted-town",
      name: "Haunted Town",
      description: "A small town with dark secrets and supernatural threats",
      genre: "horror",
      worldPrompt: "A seemingly quiet small town harbors dark secrets beneath its picturesque facade. Supernatural forces have taken root in the community, influencing residents and visitors alike. Ancient evils stir, and the boundary between the living and the dead grows thin as night falls.",
      locationTypes: ["abandoned house", "cemetery", "church", "school", "hospital", "forest", "basement", "attic"],
      characterRoles: ["local sheriff", "concerned parent", "priest", "historian", "newcomer", "cult member", "survivor", "medium"],
      customRaces: ["human", "possessed", "undead"],
      defaultSexualContent: "regular",
      defaultViolentContent: "graphic",
      tags: ["supernatural", "small-town", "psychological-horror", "mystery"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  romance: [
    {
      id: "romance-modern-workplace",
      name: "Modern Workplace Romance",
      description: "Contemporary romantic scenarios in professional settings",
      genre: "romance",
      worldPrompt: "A modern professional environment where personal and work relationships intertwine. Romantic tension builds through shared projects, office politics, and after-work social events. The setting emphasizes emotional connections, relationship development, and the challenges of balancing career and love.",
      locationTypes: ["office", "conference room", "break room", "restaurant", "hotel", "airport", "coffee shop", "gym"],
      characterRoles: ["CEO", "manager", "coworker", "client", "consultant", "secretary", "intern", "rival company executive"],
      customRaces: ["human"],
      defaultSexualContent: "explicit",
      defaultViolentContent: "regular",
      tags: ["workplace", "professional", "contemporary", "emotional"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  historical: [
    {
      id: "historical-victorian-london",
      name: "Victorian London",
      description: "19th century London with its social complexities and industrial atmosphere",
      genre: "historical",
      worldPrompt: "Victorian London in the height of the Industrial Revolution. Gas-lit streets hide both opportunity and danger, while rigid social hierarchies define daily life. Steam-powered technology is changing the world, but tradition and propriety still rule society. Mystery and romance lurk in the fog-shrouded alleyways.",
      locationTypes: ["mansion", "factory", "pub", "theater", "park", "railway station", "workhouse", "gentleman's club"],
      characterRoles: ["gentleman", "lady", "factory worker", "detective", "inventor", "servant", "doctor", "street vendor", "aristocrat", "journalist"],
      customRaces: ["human"],
      defaultSexualContent: "regular",
      defaultViolentContent: "regular",
      tags: ["victorian", "industrial", "class-system", "mystery"],
      creator: "Waidrin",
      version: "1.0.0",
    }
  ],
  custom: [
    {
      id: "custom-template-base",
      name: "Custom Template",
      description: "A basic template for creating custom scenarios",
      genre: "custom",
      worldPrompt: "A flexible world that adapts to your creative vision. Define the rules, setting, and atmosphere to match your desired roleplay experience.",
      locationTypes: ["location1", "location2", "location3"],
      characterRoles: ["role1", "role2", "role3"],
      tags: ["custom", "flexible", "user-defined"],
      creator: "User",
      version: "1.0.0",
    }
  ]
};

/**
 * Template validation utilities
 */
export class TemplateValidator {
  static validate(template: unknown): z.ZodSafeParseResult<ScenarioTemplate> {
    return ScenarioTemplateValidation.safeParse(template);
  }

  static validateCollection(collection: unknown): z.ZodSafeParseResult<z.infer<typeof TemplateCollection>> {
    return TemplateCollection.safeParse(collection);
  }

  static checkForConflicts(template: ScenarioTemplate, existingTemplates: ScenarioTemplate[]): string[] {
    const conflicts: string[] = [];
    
    // Check for duplicate IDs
    if (existingTemplates.some(t => t.id === template.id)) {
      conflicts.push(`Template ID "${template.id}" already exists`);
    }
    
    // Check for duplicate names within the same genre
    if (existingTemplates.some(t => t.name === template.name && t.genre === template.genre)) {
      conflicts.push(`Template name "${template.name}" already exists for genre "${template.genre}"`);
    }
    
    return conflicts;
  }
}

/**
 * Template management utilities
 */
export class TemplateManager {
  private templates: ScenarioTemplate[] = [];

  constructor(templates: ScenarioTemplate[] = []) {
    this.templates = templates;
  }

  // Load default templates for all genres
  loadDefaults(): void {
    this.templates = Object.values(DEFAULT_TEMPLATES).flat();
  }

  // Get all templates or filter by genre
  getTemplates(genre?: Genre): ScenarioTemplate[] {
    if (genre) {
      return this.templates.filter(t => t.genre === genre);
    }
    return [...this.templates];
  }

  // Get template by ID
  getTemplate(id: string): ScenarioTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  // Add a new template
  addTemplate(template: ScenarioTemplate): { success: boolean; errors: string[] } {
    const validation = TemplateValidator.validate(template);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }

    const conflicts = TemplateValidator.checkForConflicts(template, this.templates);
    if (conflicts.length > 0) {
      return { success: false, errors: conflicts };
    }

    this.templates.push(validation.data);
    return { success: true, errors: [] };
  }

  // Update existing template
  updateTemplate(id: string, updates: Partial<ScenarioTemplate>): { success: boolean; errors: string[] } {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      return { success: false, errors: [`Template with ID "${id}" not found`] };
    }

    const updatedTemplate = { ...this.templates[index], ...updates };
    const validation = TemplateValidator.validate(updatedTemplate);
    
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }

    this.templates[index] = validation.data;
    return { success: true, errors: [] };
  }

  // Remove template
  removeTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates.splice(index, 1);
    return true;
  }

  // Export templates to JSON
  export(): string {
    const collection = {
      version: "1.0.0",
      templates: this.templates,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: "Waidrin Template Manager"
      }
    };
    return JSON.stringify(collection, null, 2);
  }

  // Import templates from JSON
  import(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const validation = TemplateValidator.validateCollection(data);
      
      if (!validation.success) {
        return {
          success: false,
          imported: 0,
          errors: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      let imported = 0;
      const errors: string[] = [];

      for (const template of validation.data.templates) {
        const result = this.addTemplate(template);
        if (result.success) {
          imported++;
        } else {
          errors.push(`Template "${template.name}": ${result.errors.join(', ')}`);
        }
      }

      return { success: imported > 0, imported, errors };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

/**
 * Template application utilities
 */
export class TemplateApplicator {
  // Apply template to state (returns suggested state modifications)
  static applyTemplate(template: ScenarioTemplate): {
    worldPrompt: string;
    locationTypes: string[];
    characterRoles: string[];
    customRaces?: string[];
    customGenders?: string[];
    defaultContentLevels: {
      sexual: SexualContentLevel;
      violent: ViolentContentLevel;
    };
  } {
    return {
      worldPrompt: template.worldPrompt,
      locationTypes: [...template.locationTypes],
      characterRoles: [...template.characterRoles],
      customRaces: template.customRaces ? [...template.customRaces] : undefined,
      customGenders: template.customGenders ? [...template.customGenders] : undefined,
      defaultContentLevels: {
        sexual: template.defaultSexualContent || "regular",
        violent: template.defaultViolentContent || "regular"
      }
    };
  }

  // Generate world description based on template
  static generateWorldDescription(template: ScenarioTemplate): string {
    return `${template.description}\n\n${template.worldPrompt}`;
  }

  // Get character role suggestions for template
  static getCharacterRoleSuggestions(template: ScenarioTemplate, count: number = 5): string[] {
    const roles = [...template.characterRoles];
    if (roles.length <= count) return roles;
    
    // Return a random selection if there are more roles than requested
    const shuffled = roles.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Get location type suggestions for template
  static getLocationTypeSuggestions(template: ScenarioTemplate, count: number = 8): string[] {
    const locations = [...template.locationTypes];
    if (locations.length <= count) return locations;
    
    // Return a random selection if there are more locations than requested
    const shuffled = locations.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

/**
 * Template search and filtering utilities
 */
export class TemplateSearch {
  static searchTemplates(
    templates: ScenarioTemplate[],
    query: string,
    filters?: {
      genre?: Genre;
      tags?: string[];
      creator?: string;
    }
  ): ScenarioTemplate[] {
    let filtered = [...templates];

    // Apply filters
    if (filters?.genre) {
      filtered = filtered.filter(t => t.genre === filters.genre);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter(t => 
        t.tags && filters.tags!.some(tag => t.tags!.includes(tag))
      );
    }
    
    if (filters?.creator) {
      filtered = filtered.filter(t => t.creator === filters.creator);
    }

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        t.description.toLowerCase().includes(searchTerm) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    return filtered;
  }

  static getPopularTags(templates: ScenarioTemplate[]): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();
    
    templates.forEach(template => {
      template.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
}

// Export singleton manager instance
export const templateManager = new TemplateManager();
templateManager.loadDefaults();