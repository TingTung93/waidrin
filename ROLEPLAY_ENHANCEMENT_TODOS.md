# Roleplay Enhancement Todo List

This document outlines the comprehensive plan for implementing user-defined roleplay parameters and SillyTavern character card imports in Waidrin.

## High Priority Items (Core Foundation)

### State & Schema Updates
- [ ] **1. Update state schemas for flexible roleplay parameters**
- [ ] **2. Create SillyTavern character card schema definitions**
- [ ] **3. Implement character card import/export utilities**
- [ ] **4. Design enhanced genre selection system**
- [ ] **5. Create scenario template system architecture**

### Prompt System Overhaul
- [ ] **15. Update prompt system for dynamic genre support**
- [ ] **16. Refactor generateWorldPrompt for custom settings**
- [ ] **17. Update generateProtagonistPrompt for imported characters**
- [ ] **18. Modify generateStartingLocationPrompt for custom scenarios**
- [ ] **19. Update generateStartingCharactersPrompt for imported chars**
- [ ] **20. Enhance narratePrompt with character personalities**

### Critical Infrastructure
- [ ] **50. Add comprehensive testing for all new features**
- [ ] **52. Create migration system for existing saves**

## Medium Priority Items (UI & Features)

### User Interface Components
- [ ] **6. Update GenreSelect component for custom genres**
- [ ] **7. Enhance ScenarioSetup with template selection**
- [ ] **8. Add character card import UI to CharacterSelect**
- [ ] **9. Create character card drag-and-drop interface**
- [ ] **13. Implement scenario template creation UI**
- [ ] **14. Create custom scenario builder interface**

### Character Card System
- [ ] **10. Implement character card validation and parsing**
- [ ] **11. Create multi-character import and management system**
- [ ] **36. Implement character card batch import**
- [ ] **40. Create character card editor interface**
- [ ] **41. Add PNG character card embedding support**
- [ ] **42. Implement character card metadata extraction**
- [ ] **44. Add error handling for malformed character cards**

### Scenario & Template System
- [ ] **12. Design scenario template library**
- [ ] **34. Create save/load scenario templates**
- [ ] **35. Add scenario sharing and export functionality**
- [ ] **38. Add scenario preview and testing system**
- [ ] **43. Create scenario template validation system**

### Advanced Character Features
- [ ] **21. Add character book integration to prompts**
- [ ] **22. Create relationship dynamics prompt system**
- [ ] **23. Implement scenario goal tracking in prompts**
- [ ] **24. Add custom first message support**
- [ ] **25. Create alternate greeting system**
- [ ] **26. Add character memory and relationship tracking**
- [ ] **28. Create genre-specific location type schemas**

### Documentation & Polish
- [ ] **51. Update documentation for new roleplay features**

## Low Priority Items (Polish & Extensions)

### Advanced Customization
- [ ] **27. Implement character consistency checking**
- [ ] **29. Add sci-fi and modern genre support**
- [ ] **30. Implement custom race/species system**
- [ ] **31. Create character appearance generation system**
- [ ] **32. Add character voice/speech pattern system**
- [ ] **33. Implement scenario branching and multiple endings**

### Advanced UI Features
- [ ] **37. Create character relationship matrix UI**
- [ ] **39. Implement character card format conversion**
- [ ] **45. Implement character card backup and recovery**
- [ ] **46. Create character conflict resolution system**
- [ ] **47. Add scenario complexity estimation**
- [ ] **48. Implement dynamic character introduction timing**
- [ ] **49. Create scenario pacing control system**

## Implementation Strategy

### Phase 1: Foundation (High Priority)
1. Start with state schema updates and SillyTavern character card definitions
2. Implement basic character card import/export utilities
3. Create flexible prompt system architecture
4. Add migration system for existing saves

### Phase 2: Core Features (Medium Priority)
1. Build enhanced UI components for genre/scenario selection
2. Implement character card management system
3. Create scenario template system
4. Add character relationship and memory tracking

### Phase 3: Advanced Features (Low Priority)
1. Add support for additional genres beyond fantasy
2. Implement advanced character customization
3. Create sophisticated scenario branching and pacing controls
4. Add comprehensive character relationship management

## Technical Notes

### SillyTavern Character Card V2 Format
```typescript
type TavernCardV2 = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: string,
    description: string,
    personality: string,
    scenario: string,
    first_mes: string,
    mes_example: string,
    creator_notes: string,
    system_prompt: string,
    post_history_instructions: string,
    alternate_greetings: string[],
    character_book?: CharacterBook,
    tags: string[],
    creator: string,
    character_version: string,
    extensions: Record<string, any>
  }
}
```

### Key Integration Points
- State management system (Zustand + Immer)
- Prompt generation system (`lib/prompts.ts`)
- Schema validation (Zod schemas in `lib/schemas.ts`)
- UI components (`views/` and `components/`)
- Engine state machine (`lib/engine.ts`)

This enhancement will transform Waidrin from a fixed fantasy RPG system into a flexible, user-customizable roleplay engine supporting multiple genres, imported characters, and custom scenarios.