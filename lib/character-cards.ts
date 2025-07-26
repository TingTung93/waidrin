// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as schemas from "./schemas";
import type { Character, TavernCardV2, Gender, Race } from "./state";

export interface CharacterCardImportResult {
  success: boolean;
  character?: Character;
  error?: string;
}

export interface CharacterCardExportResult {
  success: boolean;
  cardData?: string;
  error?: string;
}

export class CharacterCardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CharacterCardError";
  }
}

// Parse SillyTavern character card from JSON string
export function parseCharacterCard(jsonData: string): CharacterCardImportResult {
  try {
    const cardData = JSON.parse(jsonData);
    
    // Validate against schema
    const validationResult = schemas.TavernCardV2.safeParse(cardData);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid character card format: ${validationResult.error.message}`,
      };
    }

    const tavernCard = validationResult.data;
    const character = tavernCardToCharacter(tavernCard);
    
    return {
      success: true,
      character,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse character card: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Convert TavernCardV2 to internal Character format
export function tavernCardToCharacter(tavernCard: TavernCardV2): Character {
  const data = tavernCard.data;
  
  // Attempt to determine gender from character data
  const gender = inferGenderFromCard(data);
  
  // Use custom race if character has non-standard race
  const race = inferRaceFromCard(data);
  
  return {
    name: data.name,
    gender,
    race,
    biography: data.description || data.personality || "No description provided",
    locationIndex: 0,
    // SillyTavern specific fields
    tavernCard,
    personality: data.personality,
    scenario: data.scenario,
    firstMessage: data.first_mes,
    exampleMessages: data.mes_example,
    characterBook: data.character_book,
    alternateGreetings: data.alternate_greetings,
    tags: data.tags,
    creator: data.creator,
    isImported: true,
  };
}

// Convert internal Character to TavernCardV2 format
export function characterToTavernCard(character: Character): TavernCardV2 {
  // If character already has a tavernCard, use it as base
  if (character.tavernCard) {
    return {
      ...character.tavernCard,
      data: {
        ...character.tavernCard.data,
        name: character.name,
        description: character.biography,
        personality: character.personality || character.tavernCard.data.personality,
        scenario: character.scenario || character.tavernCard.data.scenario,
        first_mes: character.firstMessage || character.tavernCard.data.first_mes,
        mes_example: character.exampleMessages || character.tavernCard.data.mes_example,
        character_book: character.characterBook,
        alternate_greetings: character.alternateGreetings,
        tags: character.tags,
        creator: character.creator,
      },
    };
  }
  
  // Create new tavern card from character
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: character.name,
      description: character.biography,
      personality: character.personality || "",
      scenario: character.scenario || "",
      first_mes: character.firstMessage || `*${character.name} greets you.*`,
      mes_example: character.exampleMessages || "",
      creator_notes: "",
      system_prompt: "",
      post_history_instructions: "",
      alternate_greetings: character.alternateGreetings || [],
      character_book: character.characterBook,
      tags: character.tags || [],
      creator: character.creator || "",
      character_version: "1.0",
    },
  };
}

// Export character as JSON string
export function exportCharacterCard(character: Character): CharacterCardExportResult {
  try {
    const tavernCard = characterToTavernCard(character);
    const cardData = JSON.stringify(tavernCard, null, 2);
    
    return {
      success: true,
      cardData,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to export character card: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Import character card from PNG image (embedded JSON)
export async function importFromPNG(file: File): Promise<CharacterCardImportResult> {
  try {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: "PNG file too large (max 10MB allowed)",
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Validate PNG signature
    if (!isPNGFile(uint8Array)) {
      return {
        success: false,
        error: "Invalid PNG file format",
      };
    }
    
    // Look for tEXt chunks containing character data
    const jsonData = extractJSONFromPNG(uint8Array);
    if (!jsonData) {
      return {
        success: false,
        error: "No character data found in PNG file",
      };
    }
    
    return parseCharacterCard(jsonData);
  } catch (error) {
    return {
      success: false,
      error: `Failed to import from PNG: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Validate PNG file signature
function isPNGFile(data: Uint8Array): boolean {
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (data.length < 8) return false;
  
  for (let i = 0; i < 8; i++) {
    if (data[i] !== pngSignature[i]) return false;
  }
  return true;
}

// Extract JSON data from PNG tEXt chunks
function extractJSONFromPNG(data: Uint8Array): string | null {
  const view = new DataView(data.buffer);
  let offset = 8; // Skip PNG signature
  
  while (offset < data.length - 8) {
    try {
      const length = view.getUint32(offset);
      
      // Validate chunk length
      if (length > data.length - offset - 12) {
        break; // Invalid chunk length
      }
      
      const type = String.fromCharCode(
        data[offset + 4],
        data[offset + 5],
        data[offset + 6],
        data[offset + 7]
      );
      
      if (type === "tEXt") {
        const textData = data.slice(offset + 8, offset + 8 + length);
        const textString = new TextDecoder("utf-8", { fatal: false }).decode(textData);
        
        // Look for common character card keys
        if (textString.includes("chara") || textString.includes("spec") || textString.includes("data")) {
          const nullIndex = textString.indexOf('\0');
          if (nullIndex !== -1) {
            const jsonPart = textString.slice(nullIndex + 1);
            try {
              JSON.parse(jsonPart);
              return jsonPart;
            } catch {
              // Continue looking for valid JSON
            }
          }
        }
      } else if (type === "IEND") {
        // End of PNG file
        break;
      }
      
      offset += 8 + length + 4; // Skip chunk length, type, data, and CRC
    } catch {
      // Skip corrupted chunk
      break;
    }
  }
  
  return null;
}

// Batch import multiple character cards with progress tracking
export async function batchImportCharacterCards(
  files: FileList,
  onProgress?: (progress: { processed: number; total: number; current: string }) => void
): Promise<{
  successful: Character[];
  failed: Array<{ filename: string; error: string; fileType?: string }>;
  duplicates: Array<{ filename: string; existingName: string }>;
  statistics: {
    totalFiles: number;
    processedFiles: number;
    successRate: number;
    totalCharacters: number;
    avgTokensPerCharacter: number;
  };
}> {
  const successful: Character[] = [];
  const failed: Array<{ filename: string; error: string; fileType?: string }> = [];
  const duplicates: Array<{ filename: string; existingName: string }> = [];
  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;
  
  // Track character names to detect duplicates
  const characterNames = new Set<string>();
  let totalTokens = 0;
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    // Report progress
    onProgress?.({
      processed: i,
      total: totalFiles,
      current: file.name,
    });
    
    try {
      // Validate file size (max 50MB for batch operations)
      if (file.size > 50 * 1024 * 1024) {
        failed.push({
          filename: file.name,
          error: "File too large (max 50MB per file in batch operations)",
          fileType: file.type,
        });
        continue;
      }
      
      let result: CharacterCardImportResult;
      
      if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
        result = await importFromPNG(file);
      } else if (file.type === "application/json" || file.name.toLowerCase().endsWith(".json")) {
        const text = await file.text();
        result = parseCharacterCard(text);
      } else if (file.name.toLowerCase().endsWith(".txt")) {
        // Try to parse text files as JSON
        const text = await file.text();
        result = parseCharacterCard(text);
      } else {
        failed.push({
          filename: file.name,
          error: "Unsupported file type. Use JSON, PNG, or TXT files.",
          fileType: file.type,
        });
        continue;
      }
      
      if (result.success && result.character) {
        // Check for duplicate names
        const characterName = result.character.name.toLowerCase().trim();
        if (characterNames.has(characterName)) {
          duplicates.push({
            filename: file.name,
            existingName: result.character.name,
          });
        } else {
          characterNames.add(characterName);
          successful.push(result.character);
          
          // Calculate tokens for statistics
          const summary = generateCharacterSummary(result.character);
          totalTokens += summary.estimatedTokens;
        }
      } else {
        failed.push({
          filename: file.name,
          error: result.error || "Unknown error",
          fileType: file.type,
        });
      }
    } catch (error) {
      failed.push({
        filename: file.name,
        error: `Processing error: ${error instanceof Error ? error.message : String(error)}`,
        fileType: file.type,
      });
    }
  }
  
  // Final progress report
  onProgress?.({
    processed: totalFiles,
    total: totalFiles,
    current: "Complete",
  });
  
  return {
    successful,
    failed,
    duplicates,
    statistics: {
      totalFiles,
      processedFiles: successful.length + failed.length + duplicates.length,
      successRate: totalFiles > 0 ? Math.round((successful.length / totalFiles) * 100) : 0,
      totalCharacters: successful.length,
      avgTokensPerCharacter: successful.length > 0 ? Math.round(totalTokens / successful.length) : 0,
    },
  };
}

// Helper functions for character inference
function inferGenderFromCard(data: TavernCardV2["data"]): Gender {
  const text = `${data.name} ${data.description} ${data.personality}`.toLowerCase();
  
  // Look for gender indicators
  if (text.includes("she") || text.includes("her") || text.includes("woman") || text.includes("girl") || text.includes("female")) {
    return "female";
  }
  if (text.includes("he") || text.includes("him") || text.includes("man") || text.includes("boy") || text.includes("male")) {
    return "male";
  }
  
  // Default to male for compatibility
  return "male";
}

function inferRaceFromCard(data: TavernCardV2["data"]): Race {
  const text = `${data.name} ${data.description} ${data.personality}`.toLowerCase();
  
  // Look for race indicators
  if (text.includes("elf") || text.includes("elven")) {
    return "elf";
  }
  if (text.includes("dwarf") || text.includes("dwarven")) {
    return "dwarf";
  }
  if (text.includes("human") || text.includes("person")) {
    return "human";
  }
  
  // For non-standard races, use custom
  if (text.includes("orc") || text.includes("demon") || text.includes("angel") || 
      text.includes("dragon") || text.includes("cat") || text.includes("wolf") ||
      text.includes("fox") || text.includes("robot") || text.includes("android")) {
    return "custom";
  }
  
  // Default to human
  return "human";
}

// Validate character card format
export function validateCharacterCard(data: unknown): { valid: boolean; errors: string[] } {
  const result = schemas.TavernCardV2.safeParse(data);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  const errors = result.error.issues.map(issue => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  
  return { valid: false, errors };
}

// Create a minimal character card template
export function createMinimalCharacterCard(name: string, description: string): TavernCardV2 {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name,
      description,
      personality: "",
      scenario: "",
      first_mes: `*${name} greets you.*`,
      mes_example: "",
      creator_notes: "",
      system_prompt: "",
      post_history_instructions: "",
      alternate_greetings: [],
      tags: [],
      creator: "",
      character_version: "1.0",
    },
  };
}

// Character book utilities
export interface CharacterBookValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalEntries: number;
    enabledEntries: number;
    averageContentLength: number;
    totalTokenEstimate: number;
  };
}

// Validate character book structure and content
export function validateCharacterBook(book: import("./state").CharacterBook): CharacterBookValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalEntries = 0;
  let enabledEntries = 0;
  let totalContentLength = 0;
  let totalTokenEstimate = 0;

  if (!book.entries) {
    return {
      valid: true,
      errors: [],
      warnings: ["Character book has no entries"],
      stats: { totalEntries: 0, enabledEntries: 0, averageContentLength: 0, totalTokenEstimate: 0 }
    };
  }

  totalEntries = book.entries.length;

  for (const [index, entry] of book.entries.entries()) {
    if (!entry.keys || entry.keys.length === 0) {
      errors.push(`Entry ${index}: No keys defined`);
    }

    if (!entry.content.trim()) {
      errors.push(`Entry ${index}: Empty content`);
    }

    if (entry.enabled) {
      enabledEntries++;
    }

    totalContentLength += entry.content.length;
    // Rough token estimate (1 token ≈ 4 characters)
    totalTokenEstimate += Math.ceil(entry.content.length / 4);

    // Check for potential issues
    if (entry.keys.some(key => key.length < 2)) {
      warnings.push(`Entry ${index}: Very short key found (< 2 characters)`);
    }

    if (entry.content.length > 2000) {
      warnings.push(`Entry ${index}: Very long content (${entry.content.length} chars)`);
    }

    if (entry.keys.length > 10) {
      warnings.push(`Entry ${index}: Many keys (${entry.keys.length}), may affect performance`);
    }
  }

  // Token budget validation
  if (book.token_budget && totalTokenEstimate > book.token_budget) {
    warnings.push(`Total estimated tokens (${totalTokenEstimate}) exceed budget (${book.token_budget})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalEntries,
      enabledEntries,
      averageContentLength: totalEntries > 0 ? Math.round(totalContentLength / totalEntries) : 0,
      totalTokenEstimate,
    },
  };
}

// Merge multiple character books
export function mergeCharacterBooks(...books: import("./state").CharacterBook[]): import("./state").CharacterBook {
  const merged: import("./state").CharacterBook = {
    name: "Merged Character Book",
    description: "Combined from multiple character books",
    entries: [],
  };

  let nextId = 1;
  let nextOrder = 0;

  for (const book of books) {
    if (!book.entries) continue;

    for (const entry of book.entries) {
      merged.entries!.push({
        ...entry,
        id: entry.id || nextId++,
        insertion_order: nextOrder++,
        name: entry.name || `Entry from ${book.name || 'Unknown Book'}`,
      });
    }

    // Use highest token budget
    if (book.token_budget && (!merged.token_budget || book.token_budget > merged.token_budget)) {
      merged.token_budget = book.token_budget;
    }

    // Use deepest scan depth
    if (book.scan_depth && (!merged.scan_depth || book.scan_depth > merged.scan_depth)) {
      merged.scan_depth = book.scan_depth;
    }

    // Enable recursive scanning if any book uses it
    if (book.recursive_scanning) {
      merged.recursive_scanning = true;
    }
  }

  return merged;
}

// Search character book entries by key
export function searchCharacterBookEntries(book: import("./state").CharacterBook, searchText: string): import("./state").CharacterBook["entries"] {
  if (!book.entries) return [];

  const searchLower = searchText.toLowerCase();
  
  return book.entries.filter(entry => {
    if (!entry.enabled) return false;

    // Search in keys
    if (entry.keys.some(key => key.toLowerCase().includes(searchLower))) {
      return true;
    }

    // Search in secondary keys
    if (entry.secondary_keys?.some(key => key.toLowerCase().includes(searchLower))) {
      return true;
    }

    // Search in content
    if (entry.content.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in name and comment
    if (entry.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    if (entry.comment?.toLowerCase().includes(searchLower)) {
      return true;
    }

    return false;
  });
}

// Export character book as standalone JSON
export function exportCharacterBook(book: import("./state").CharacterBook): string {
  return JSON.stringify(book, null, 2);
}

// Import character book from JSON
export function importCharacterBook(jsonData: string): { success: boolean; book?: import("./state").CharacterBook; error?: string } {
  try {
    const data = JSON.parse(jsonData);
    const result = schemas.CharacterBook.safeParse(data);
    
    if (!result.success) {
      return {
        success: false,
        error: `Invalid character book format: ${result.error.message}`,
      };
    }

    return {
      success: true,
      book: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse character book: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Generate character card summary for UI display
export interface CharacterCardSummary {
  name: string;
  description: string;
  hasPersonality: boolean;
  hasScenario: boolean;
  hasFirstMessage: boolean;
  hasExampleMessages: boolean;
  hasCharacterBook: boolean;
  hasAlternateGreetings: boolean;
  tagCount: number;
  estimatedTokens: number;
}

export function generateCharacterSummary(character: Character): CharacterCardSummary {
  const estimatedTokens = Math.ceil([
    character.biography,
    character.personality || "",
    character.scenario || "",
    character.firstMessage || "",
    character.exampleMessages || "",
  ].join(" ").length / 4);

  return {
    name: character.name,
    description: character.biography.slice(0, 200) + (character.biography.length > 200 ? "..." : ""),
    hasPersonality: !!character.personality?.trim(),
    hasScenario: !!character.scenario?.trim(),
    hasFirstMessage: !!character.firstMessage?.trim(),
    hasExampleMessages: !!character.exampleMessages?.trim(),
    hasCharacterBook: !!character.characterBook?.entries?.length,
    hasAlternateGreetings: !!character.alternateGreetings?.length,
    tagCount: character.tags?.length || 0,
    estimatedTokens,
  };
}

// Advanced character card validation with detailed feedback
export interface DetailedValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  completeness: {
    score: number; // 0-100
    missing: string[];
    recommended: string[];
  };
}

export function validateCharacterCardDetailed(character: Character): DetailedValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const missing: string[] = [];
  const recommended: string[] = [];
  
  let completenessScore = 0;
  const maxScore = 10;

  // Essential fields
  if (!character.name?.trim()) {
    errors.push("Character name is required");
  } else {
    completenessScore++;
  }

  if (!character.biography?.trim()) {
    errors.push("Character biography/description is required");
  } else {
    completenessScore++;
    if (character.biography.length < 50) {
      warnings.push("Biography is quite short, consider adding more detail");
    }
  }

  // Important fields
  if (!character.personality?.trim()) {
    missing.push("personality");
  } else {
    completenessScore++;
  }

  if (!character.firstMessage?.trim()) {
    missing.push("first message");
  } else {
    completenessScore++;
  }

  // Recommended fields
  if (!character.scenario?.trim()) {
    recommended.push("scenario description");
  } else {
    completenessScore++;
  }

  if (!character.exampleMessages?.trim()) {
    recommended.push("example messages");
  } else {
    completenessScore++;
  }

  if (!character.tags?.length) {
    recommended.push("character tags");
  } else {
    completenessScore++;
  }

  if (!character.alternateGreetings?.length) {
    recommended.push("alternate greetings");
  } else {
    completenessScore++;
  }

  if (!character.characterBook?.entries?.length) {
    recommended.push("character book entries");
  } else {
    completenessScore++;
    const bookValidation = validateCharacterBook(character.characterBook);
    if (!bookValidation.valid) {
      errors.push(...bookValidation.errors.map(e => `Character book: ${e}`));
    }
    warnings.push(...bookValidation.warnings.map(w => `Character book: ${w}`));
  }

  if (!character.creator?.trim()) {
    recommended.push("creator attribution");
  } else {
    completenessScore++;
  }

  // Suggestions
  if (character.biography && character.personality && character.biography === character.personality) {
    suggestions.push("Biography and personality are identical - consider making them distinct");
  }

  if (character.firstMessage && character.firstMessage.length < 20) {
    suggestions.push("First message is quite short - consider adding more detail");
  }

  if (character.tags && character.tags.length > 20) {
    warnings.push("Many tags assigned - consider reducing for better organization");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    completeness: {
      score: Math.round((completenessScore / maxScore) * 100),
      missing,
      recommended,
    },
  };
}

// Utility function to sanitize character data for safe storage
export function sanitizeCharacterData(character: Character): Character {
  return {
    ...character,
    name: character.name.trim().slice(0, 100),
    biography: character.biography.trim().slice(0, 2000),
    personality: character.personality?.trim().slice(0, 2000),
    scenario: character.scenario?.trim().slice(0, 2000),
    firstMessage: character.firstMessage?.trim().slice(0, 1000),
    exampleMessages: character.exampleMessages?.trim().slice(0, 5000),
    tags: character.tags?.slice(0, 50).map(tag => tag.trim().slice(0, 50)),
    alternateGreetings: character.alternateGreetings?.slice(0, 20).map(greeting => greeting.trim().slice(0, 1000)),
  };
}

// Convert character to a format suitable for search indexing
export function createCharacterSearchIndex(character: Character): {
  id: string;
  name: string;
  searchableText: string;
  tags: string[];
  hasCharacterBook: boolean;
  estimatedTokens: number;
} {
  const searchableText = [
    character.name,
    character.biography,
    character.personality || "",
    character.scenario || "",
    character.creator || "",
    ...(character.tags || []),
  ].join(" ").toLowerCase();

  return {
    id: `${character.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`,
    name: character.name,
    searchableText,
    tags: character.tags || [],
    hasCharacterBook: !!character.characterBook?.entries?.length,
    estimatedTokens: generateCharacterSummary(character).estimatedTokens,
  };
}

// Merge character data with imported tavern card data
export function mergeCharacterWithTavernCard(existingCharacter: Character, tavernCard: TavernCardV2): Character {
  const imported = tavernCardToCharacter(tavernCard);
  
  return {
    ...existingCharacter,
    // Keep existing core identity
    name: existingCharacter.name,
    gender: existingCharacter.gender,
    race: existingCharacter.race,
    locationIndex: existingCharacter.locationIndex,
    
    // Merge biographical information
    biography: imported.biography || existingCharacter.biography,
    
    // Add/update SillyTavern fields
    tavernCard,
    personality: imported.personality || existingCharacter.personality,
    scenario: imported.scenario || existingCharacter.scenario,
    firstMessage: imported.firstMessage || existingCharacter.firstMessage,
    exampleMessages: imported.exampleMessages || existingCharacter.exampleMessages,
    characterBook: imported.characterBook || existingCharacter.characterBook,
    alternateGreetings: [
      ...(existingCharacter.alternateGreetings || []),
      ...(imported.alternateGreetings || []),
    ],
    tags: [
      ...(existingCharacter.tags || []),
      ...(imported.tags || []),
    ].filter((tag, index, array) => array.indexOf(tag) === index), // Remove duplicates
    creator: imported.creator || existingCharacter.creator,
    isImported: true,
  };
}

// Generate a character comparison report
export interface CharacterComparisonResult {
  similarity: number; // 0-100
  differences: {
    field: string;
    original: string;
    updated: string;
  }[];
  recommendations: string[];
}

export function compareCharacters(original: Character, updated: Character): CharacterComparisonResult {
  const differences: CharacterComparisonResult["differences"] = [];
  const recommendations: string[] = [];
  let similarities = 0;
  let totalFields = 0;

  const compareField = (field: keyof Character, label: string) => {
    totalFields++;
    const originalValue = String(original[field] || "");
    const updatedValue = String(updated[field] || "");
    
    if (originalValue === updatedValue) {
      similarities++;
    } else if (originalValue && updatedValue && originalValue !== updatedValue) {
      differences.push({
        field: label,
        original: originalValue.slice(0, 100),
        updated: updatedValue.slice(0, 100),
      });
    }
  };

  compareField("name", "Name");
  compareField("biography", "Biography");
  compareField("personality", "Personality");
  compareField("scenario", "Scenario");
  compareField("firstMessage", "First Message");
  compareField("exampleMessages", "Example Messages");

  // Special handling for arrays
  const originalTags = (original.tags || []).sort();
  const updatedTags = (updated.tags || []).sort();
  totalFields++;
  
  if (JSON.stringify(originalTags) === JSON.stringify(updatedTags)) {
    similarities++;
  } else {
    differences.push({
      field: "Tags",
      original: originalTags.join(", "),
      updated: updatedTags.join(", "),
    });
  }

  // Generate recommendations
  if (updated.characterBook && !original.characterBook) {
    recommendations.push("Consider adding the character book from the updated version");
  }
  
  if (updated.alternateGreetings?.length && !original.alternateGreetings?.length) {
    recommendations.push("The updated version includes alternate greetings that could enhance roleplay");
  }
  
  if (updated.tags?.length && updated.tags.length > (original.tags?.length || 0)) {
    recommendations.push("Updated version has more descriptive tags for better organization");
  }

  const similarity = totalFields > 0 ? Math.round((similarities / totalFields) * 100) : 0;

  return {
    similarity,
    differences,
    recommendations,
  };
}

// Export character collection as a bundle
export function exportCharacterBundle(characters: Character[]): string {
  const bundle = {
    type: "character_bundle",
    version: "1.0",
    created: new Date().toISOString(),
    characters: characters.map(char => characterToTavernCard(char)),
    metadata: {
      totalCharacters: characters.length,
      bundleSize: JSON.stringify(characters).length,
      averageTokens: characters.length > 0 ? 
        Math.round(characters.reduce((sum, char) => sum + generateCharacterSummary(char).estimatedTokens, 0) / characters.length) : 0,
    },
  };

  return JSON.stringify(bundle, null, 2);
}

// Import character bundle
export function importCharacterBundle(bundleData: string): {
  success: boolean;
  characters?: Character[];
  errors?: string[];
  metadata?: any;
} {
  try {
    const bundle = JSON.parse(bundleData);
    
    if (bundle.type !== "character_bundle") {
      return {
        success: false,
        errors: ["Invalid bundle format: not a character bundle"],
      };
    }

    const characters: Character[] = [];
    const errors: string[] = [];

    for (const [index, cardData] of (bundle.characters || []).entries()) {
      const result = schemas.TavernCardV2.safeParse(cardData);
      
      if (result.success) {
        characters.push(tavernCardToCharacter(result.data));
      } else {
        errors.push(`Character ${index + 1}: ${result.error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      characters,
      errors: errors.length > 0 ? errors : undefined,
      metadata: bundle.metadata,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse bundle: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}