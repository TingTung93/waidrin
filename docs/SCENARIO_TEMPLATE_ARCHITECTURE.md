# Scenario Template System Architecture

## Overview

The Scenario Template System provides a comprehensive framework for creating, managing, and applying rich scenario templates in Waidrin. This system transforms the roleplay experience from basic genre selection to sophisticated, template-driven world building.

## Architecture Components

### 1. Core Schema (`lib/schemas.ts`)

The existing `ScenarioTemplate` schema defines the structure:

```typescript
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
```

### 2. Template Management (`lib/scenario-templates.ts`)

**Key Classes:**
- `TemplateValidator`: Validates templates and checks for conflicts
- `TemplateManager`: CRUD operations for template collections
- `TemplateApplicator`: Applies templates to game state
- `TemplateSearch`: Search and filtering functionality

**Default Templates:**
- Pre-built templates for all 7 genres (fantasy, scifi, modern, horror, romance, historical, custom)
- Each genre has multiple template variants
- Templates include rich world prompts, location types, character roles, and metadata

### 3. State Integration (`lib/template-integration.ts`)

**Functions:**
- `applyTemplateToState()`: Merges template settings with current state
- `getTemplateWorldPrompt()`: Generates template-aware world prompts
- `getTemplateCharacterPrompt()`: Creates character prompts based on template
- `validateStateTemplateCompatibility()`: Checks template/state compatibility
- `extractTemplateFromState()`: Creates templates from existing scenarios

### 4. Enhanced Prompts (`lib/prompts-enhanced.ts`)

Template-aware versions of existing prompt functions:
- `generateEnhancedWorldPrompt()`: Uses template world settings
- `generateEnhancedProtagonistPrompt()`: Template-aware character generation
- `generateEnhancedStartingLocationPrompt()`: Location generation with template context
- `generateEnhancedNarratePrompt()`: Maintains template consistency in narration

### 5. UI Components

#### `components/TemplateSelector.tsx`
- Grid-based template browser
- Search and filtering by creator, tags, genre
- Template cards with key information
- Official template badging

#### `components/TemplatePreview.tsx`
- Detailed template information display
- Content level indicators
- Location types and character roles overview
- Apply/cancel actions

#### `views/TemplateSetup.tsx`
- Wizard step integration
- Template selection workflow
- Preview functionality
- Skip template option

## Data Flow

### Template Application Flow
1. User selects template in `TemplateSetup` view
2. Template preview shown with full template details
3. User applies template via `applyTemplateToState()`
4. State updated with template settings
5. Enhanced prompts use template context for generation

### World Generation Flow
1. Engine calls `generateEnhancedWorldPrompt()`
2. If template exists, uses `getTemplateWorldPrompt()`
3. Template-specific world generation prompt created
4. Backend generates world matching template specifications

### Character Generation Flow
1. Engine calls `generateEnhancedProtagonistPrompt()` or `generateEnhancedStartingCharactersPrompt()`
2. Template character roles and races incorporated
3. Characters generated matching template specifications
4. Character consistency maintained through template context

## Template Structure

### Minimal Template
```typescript
{
  id: "unique-id",
  name: "Template Name",
  description: "Brief description",
  genre: "fantasy",
  worldPrompt: "Rich world description...",
  locationTypes: ["tavern", "forest", "castle"],
  characterRoles: ["knight", "wizard", "merchant"],
  creator: "Author",
  version: "1.0.0"
}
```

### Full Template
```typescript
{
  id: "fantasy-dark-magic",
  name: "Dark Magic Realm",
  description: "A darker fantasy world where forbidden magic shapes reality",
  genre: "fantasy",
  worldPrompt: "Detailed world setting description...",
  locationTypes: ["haunted castle", "cursed forest", "necropolis"],
  characterRoles: ["dark knight", "necromancer", "demon hunter"],
  customRaces: ["tiefling", "undead", "shadow-touched"],
  customGenders: ["male", "female", "non-binary"],
  defaultSexualContent: "regular",
  defaultViolentContent: "graphic",
  tags: ["dark-fantasy", "necromancy", "moral-ambiguity"],
  creator: "Waidrin",
  version: "1.0.0"
}
```

## Integration Points

### State Management
- `scenarioTemplate` field in main state
- `customRaces` and `customLocationTypes` arrays
- Content level defaults from templates

### Prompt System
- Enhanced prompts check for template existence
- Template context included in all generation prompts
- Consistent world/character generation

### UI Wizard Flow
1. Welcome → Connection → Genre Selection
2. **NEW: Template Setup** (optional)
3. Character Selection → Scenario Setup → Chat

### Engine Integration
- Template settings applied during world generation
- Character generation uses template roles
- Location generation follows template types
- Narration maintains template consistency

## Extensibility

### Custom Template Creation
- Users can create templates from current scenarios
- Template validation ensures quality
- Import/export functionality for sharing

### Template Collections
- JSON-based template sharing
- Version management
- Metadata tracking

### Plugin Integration
- Templates can be extended by plugins
- Custom template sources
- Dynamic template generation

## Error Handling

### Validation
- Schema validation for all templates
- Conflict detection (duplicate IDs, names)
- Content validation (minimum requirements)

### Compatibility
- State/template compatibility checking
- Graceful fallbacks for missing templates
- Warning system for potential issues

### Recovery
- Malformed template handling
- Import error recovery
- State corruption prevention

## Performance Considerations

### Lazy Loading
- Templates loaded on demand
- Default templates cached
- Search indexing for large collections

### Memory Management
- Template manager singleton pattern
- Efficient search algorithms
- Minimal state storage

### Caching
- Template validation results cached
- Search results cached
- Prompt generation optimized

## Future Enhancements

### Planned Features
1. Template editor UI for custom creation
2. Community template sharing
3. Template rating and reviews
4. Advanced template validation rules
5. Template inheritance and composition

### Advanced Integrations
1. SillyTavern character card template embedding
2. Procedural template generation
3. AI-assisted template creation
4. Template analytics and usage tracking

## Security Considerations

### Input Validation
- All user-provided template data validated
- XSS prevention in template content
- Safe prompt injection handling

### Template Integrity
- Official template signing
- Template source verification
- Malicious content detection

### User Privacy
- No tracking in template usage
- Local template storage option
- Opt-in analytics only

## Testing Strategy

### Unit Tests
- Template validation logic
- State integration functions
- Search and filtering algorithms

### Integration Tests
- End-to-end template application
- UI component interactions
- Prompt generation with templates

### Validation Tests
- Template schema compliance
- Content quality validation
- Performance benchmarks

## Deployment

### Requirements
- No additional dependencies
- Backward compatible with existing saves
- Graceful degradation without templates

### Migration
- Existing states work without templates
- Template field additions are optional
- No breaking changes to existing functionality

### Configuration
- Templates enabled by default
- Skip template option available
- Template source configuration

This architecture provides a robust, extensible foundation for scenario templates while maintaining compatibility with existing Waidrin functionality.