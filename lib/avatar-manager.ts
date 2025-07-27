// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import type { Character } from "./state";

export interface AvatarData {
  url: string;
  seed?: number;
  id?: string;
  style?: string;
  provider?: string;
  generatedAt: number;
  characterId: string;
}

export interface AvatarStorage {
  avatars: Record<string, AvatarData[]>;
  selectedAvatars: Record<string, string>; // characterId -> avatarId
}

// Create a character ID from character data
export function getCharacterId(character: Character): string {
  return `${character.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${character.gender}_${character.race}`;
}

// Store avatar data in localStorage
export function saveAvatarData(character: Character, avatarData: Omit<AvatarData, "characterId" | "generatedAt">): void {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  
  if (!storage.avatars[characterId]) {
    storage.avatars[characterId] = [];
  }
  
  const fullAvatarData: AvatarData = {
    ...avatarData,
    characterId,
    generatedAt: Date.now()
  };
  
  storage.avatars[characterId].push(fullAvatarData);
  
  // If this is the first avatar for this character, set it as selected
  if (storage.avatars[characterId].length === 1 && avatarData.id) {
    storage.selectedAvatars[characterId] = avatarData.id;
  }
  
  setAvatarStorage(storage);
}

// Get all avatars for a character
export function getCharacterAvatars(character: Character): AvatarData[] {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  return storage.avatars[characterId] || [];
}

// Get selected avatar for a character
export function getSelectedAvatar(character: Character): AvatarData | null {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  const selectedId = storage.selectedAvatars[characterId];
  
  if (!selectedId) return null;
  
  const avatars = storage.avatars[characterId] || [];
  return avatars.find(a => a.id === selectedId) || null;
}

// Set selected avatar for a character
export function setSelectedAvatar(character: Character, avatarId: string): void {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  
  // Verify the avatar exists
  const avatars = storage.avatars[characterId] || [];
  if (avatars.find(a => a.id === avatarId)) {
    storage.selectedAvatars[characterId] = avatarId;
    setAvatarStorage(storage);
  }
}

// Delete an avatar
export function deleteAvatar(character: Character, avatarId: string): void {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  
  if (storage.avatars[characterId]) {
    storage.avatars[characterId] = storage.avatars[characterId].filter(a => a.id !== avatarId);
    
    // If the deleted avatar was selected, clear selection
    if (storage.selectedAvatars[characterId] === avatarId) {
      delete storage.selectedAvatars[characterId];
      
      // Auto-select the first remaining avatar if any
      if (storage.avatars[characterId].length > 0 && storage.avatars[characterId][0].id) {
        storage.selectedAvatars[characterId] = storage.avatars[characterId][0].id;
      }
    }
    
    setAvatarStorage(storage);
  }
}

// Clear all avatars for a character
export function clearCharacterAvatars(character: Character): void {
  const characterId = getCharacterId(character);
  const storage = getAvatarStorage();
  
  delete storage.avatars[characterId];
  delete storage.selectedAvatars[characterId];
  
  setAvatarStorage(storage);
}

// Export character avatars as JSON
export function exportCharacterAvatars(character: Character): string {
  const avatars = getCharacterAvatars(character);
  const selected = getSelectedAvatar(character);
  
  return JSON.stringify({
    character: {
      name: character.name,
      gender: character.gender,
      race: character.race
    },
    avatars,
    selectedId: selected?.id || null,
    exportedAt: new Date().toISOString()
  }, null, 2);
}

// Import character avatars from JSON
export function importCharacterAvatars(character: Character, jsonData: string): { success: boolean; error?: string; count?: number } {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.avatars || !Array.isArray(data.avatars)) {
      return { success: false, error: "Invalid avatar data format" };
    }
    
    const characterId = getCharacterId(character);
    const storage = getAvatarStorage();
    
    // Merge with existing avatars
    if (!storage.avatars[characterId]) {
      storage.avatars[characterId] = [];
    }
    
    // Add imported avatars
    for (const avatar of data.avatars) {
      if (avatar.url && avatar.id) {
        storage.avatars[characterId].push({
          ...avatar,
          characterId,
          generatedAt: avatar.generatedAt || Date.now()
        });
      }
    }
    
    // Set selected avatar if specified
    if (data.selectedId && storage.avatars[characterId].find(a => a.id === data.selectedId)) {
      storage.selectedAvatars[characterId] = data.selectedId;
    }
    
    setAvatarStorage(storage);
    
    return { success: true, count: data.avatars.length };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to parse avatar data" 
    };
  }
}

// Get avatar storage from localStorage
function getAvatarStorage(): AvatarStorage {
  if (typeof window === "undefined") {
    return { avatars: {}, selectedAvatars: {} };
  }
  
  try {
    const stored = localStorage.getItem("avatar-storage");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load avatar storage:", error);
  }
  
  return { avatars: {}, selectedAvatars: {} };
}

// Save avatar storage to localStorage
function setAvatarStorage(storage: AvatarStorage): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem("avatar-storage", JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save avatar storage:", error);
  }
}

// Generate avatar metadata for display
export interface AvatarMetadata {
  id: string;
  url: string;
  style: string;
  provider: string;
  age: string; // "Just now", "5 minutes ago", etc.
  isSelected: boolean;
}

export function getAvatarMetadata(character: Character): AvatarMetadata[] {
  const avatars = getCharacterAvatars(character);
  const selectedId = getSelectedAvatar(character)?.id;
  
  return avatars.map(avatar => ({
    id: avatar.id || "",
    url: avatar.url,
    style: avatar.style || "unknown",
    provider: avatar.provider || "unknown",
    age: getRelativeTime(avatar.generatedAt),
    isSelected: avatar.id === selectedId
  }));
}

// Convert timestamp to relative time
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

// Clean up old avatars (older than 30 days)
export function cleanupOldAvatars(daysToKeep: number = 30): number {
  const storage = getAvatarStorage();
  const cutoffTime = Date.now() - (daysToKeep * 86400000);
  let removedCount = 0;
  
  for (const characterId in storage.avatars) {
    const avatars = storage.avatars[characterId];
    const keptAvatars = avatars.filter(avatar => {
      if (avatar.generatedAt < cutoffTime) {
        removedCount++;
        return false;
      }
      return true;
    });
    
    if (keptAvatars.length !== avatars.length) {
      storage.avatars[characterId] = keptAvatars;
      
      // Update selected avatar if it was removed
      const selectedId = storage.selectedAvatars[characterId];
      if (selectedId && !keptAvatars.find(a => a.id === selectedId)) {
        if (keptAvatars.length > 0 && keptAvatars[0].id) {
          storage.selectedAvatars[characterId] = keptAvatars[0].id;
        } else {
          delete storage.selectedAvatars[characterId];
        }
      }
    }
  }
  
  setAvatarStorage(storage);
  return removedCount;
}

// Get storage statistics
export interface AvatarStorageStats {
  totalAvatars: number;
  totalCharacters: number;
  storageSize: number; // in bytes
  oldestAvatar: number | null;
  newestAvatar: number | null;
}

export function getAvatarStorageStats(): AvatarStorageStats {
  const storage = getAvatarStorage();
  let totalAvatars = 0;
  let oldest: number | null = null;
  let newest: number | null = null;
  
  for (const characterId in storage.avatars) {
    const avatars = storage.avatars[characterId];
    totalAvatars += avatars.length;
    
    for (const avatar of avatars) {
      if (oldest === null || avatar.generatedAt < oldest) {
        oldest = avatar.generatedAt;
      }
      if (newest === null || avatar.generatedAt > newest) {
        newest = avatar.generatedAt;
      }
    }
  }
  
  const storageSize = new Blob([JSON.stringify(storage)]).size;
  
  return {
    totalAvatars,
    totalCharacters: Object.keys(storage.avatars).length,
    storageSize,
    oldestAvatar: oldest,
    newestAvatar: newest
  };
}