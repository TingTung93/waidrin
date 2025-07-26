// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import * as z from "zod/v4";

const Text = z.string().trim().nonempty();

const Name = Text.max(100);

const Description = Text.max(2000);

export const Action = Text.max(200);

const Index = z.int();

const RequestParams = z.record(z.string(), z.unknown());

export const View = z.enum(["welcome", "connection", "genre", "character", "scenario", "chat"]);

export const Genre = z.enum(["fantasy", "scifi", "modern", "horror", "romance", "historical", "custom"]);

// SillyTavern Character Card V2 Format Support
export const CharacterBook = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scan_depth: z.number().optional(),
  token_budget: z.number().optional(),
  recursive_scanning: z.boolean().optional(),
  entries: z.array(z.object({
    keys: z.array(z.string()),
    content: z.string(),
    extensions: z.record(z.string(), z.unknown()).optional(),
    enabled: z.boolean(),
    insertion_order: z.number(),
    case_sensitive: z.boolean().optional(),
    name: z.string().optional(),
    priority: z.number().optional(),
    id: z.number().optional(),
    comment: z.string().optional(),
    selective: z.boolean().optional(),
    secondary_keys: z.array(z.string()).optional(),
    constant: z.boolean().optional(),
    position: z.enum(["before_char", "after_char"]).optional(),
  })).optional(),
});

export const TavernCardV2 = z.object({
  spec: z.literal("chara_card_v2"),
  spec_version: z.string(),
  data: z.object({
    name: z.string(),
    description: z.string(),
    personality: z.string(),
    scenario: z.string(),
    first_mes: z.string(),
    mes_example: z.string(),
    creator_notes: z.string().optional(),
    system_prompt: z.string().optional(),
    post_history_instructions: z.string().optional(),
    alternate_greetings: z.array(z.string()).optional(),
    character_book: CharacterBook.optional(),
    tags: z.array(z.string()).optional(),
    creator: z.string().optional(),
    character_version: z.string().optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const SexualContentLevel = z.enum(["regular", "explicit", "actively_explicit"]);

export const ViolentContentLevel = z.enum(["regular", "graphic", "pervasive"]);

export const ScenarioTemplate = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  genre: Genre,
  worldPrompt: z.string(),
  locationTypes: z.array(z.string()),
  characterRoles: z.array(z.string()),
  customRaces: z.array(z.string()).optional(),
  customGenders: z.array(z.string()).optional(),
  defaultSexualContent: SexualContentLevel.optional(),
  defaultViolentContent: ViolentContentLevel.optional(),
  tags: z.array(z.string()).optional(),
  creator: z.string().optional(),
  version: z.string().optional(),
});

export const World = z.object({
  name: Name,
  description: Description,
});

export const Gender = z.enum(["male", "female"]);

export const Race = z.enum(["human", "elf", "dwarf", "custom"]);

export const Character = z.object({
  name: Name,
  gender: Gender,
  race: Race,
  biography: Description,
  locationIndex: Index,
  // SillyTavern character card support
  tavernCard: TavernCardV2.optional(),
  personality: z.string().optional(),
  scenario: z.string().optional(),
  firstMessage: z.string().optional(),
  exampleMessages: z.string().optional(),
  characterBook: CharacterBook.optional(),
  alternateGreetings: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  creator: z.string().optional(),
  // Enhanced character properties
  appearance: z.string().optional(),
  customRace: z.string().optional(),
  voicePattern: z.string().optional(),
  relationships: z.record(z.string(), z.string()).optional(),
  isImported: z.boolean().optional(),
});

export const LocationType = z.enum(["tavern", "market", "road", "castle", "forest", "dungeon", "temple", "village", "city", "wilderness", "custom"]);

export const Location = z.object({
  name: Name,
  type: LocationType,
  description: Description,
});

export const ActionEvent = z.object({
  type: z.literal("action"),
  action: Action,
});

export const NarrationEvent = z.object({
  type: z.literal("narration"),
  text: Text.max(5000),
  locationIndex: Index,
  referencedCharacterIndices: Index.array(),
});

export const CharacterIntroductionEvent = z.object({
  type: z.literal("character_introduction"),
  characterIndex: Index,
});

export const LocationChangeEvent = z.object({
  type: z.literal("location_change"),
  locationIndex: Index,
  presentCharacterIndices: Index.array(),
});

export const Event = z.discriminatedUnion("type", [
  ActionEvent,
  NarrationEvent,
  CharacterIntroductionEvent,
  LocationChangeEvent,
]);

export const State = z.object({
  apiUrl: z.url(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  generationParams: RequestParams,
  narrationParams: RequestParams,
  updateInterval: z.int(),
  logPrompts: z.boolean(),
  logParams: z.boolean(),
  logResponses: z.boolean(),
  view: View,
  world: World,
  locations: Location.array(),
  characters: Character.array(),
  protagonist: Character,
  hiddenDestiny: z.boolean(),
  betrayal: z.boolean(),
  oppositeSexMagnet: z.boolean(),
  sameSexMagnet: z.boolean(),
  sexualContentLevel: SexualContentLevel,
  violentContentLevel: ViolentContentLevel,
  events: Event.array(),
  actions: Action.array(),
  // Enhanced roleplay features
  selectedGenre: Genre,
  customGenre: z.string().optional(),
  scenarioTemplate: ScenarioTemplate.optional(),
  importedCharacters: z.array(TavernCardV2).optional(),
  customRaces: z.array(z.string()).optional(),
  customLocationTypes: z.array(z.string()).optional(),
  enableCharacterBooks: z.boolean().optional(),
  enableAlternateGreetings: z.boolean().optional(),
  multiCharacterMode: z.boolean().optional(),
});
