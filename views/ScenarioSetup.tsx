// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Flex, Heading, RadioCards, Switch, Text, TextArea, TextField, Button, Card } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { GiBullHorns, GiDrippingBlade } from "react-icons/gi";
import { PlusIcon, MagicWandIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import WizardStep from "@/components/WizardStep";
import TemplateSelector from "@/components/TemplateSelector";
import { type SexualContentLevel, useStateStore, type ViolentContentLevel, type ScenarioTemplate } from "@/lib/state";
import { TemplateApplicator } from "@/lib/scenario-templates";

export default function ScenarioSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { state, setState } = useStateStore(
    useShallow((state) => ({
      state: state,
      setState: state.set,
    })),
  );

  const [showTemplateSelector, setShowTemplateSelector] = useState(!state.scenarioTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | undefined>(state.scenarioTemplate);

  const handleTemplateSelect = (template: ScenarioTemplate) => {
    const templateData = TemplateApplicator.applyTemplate(template);
    
    setState((state) => {
      // Apply template data to state
      state.scenarioTemplate = template;
      state.world.name = state.world.name === "[name]" ? `${template.name} World` : state.world.name;
      state.world.description = state.world.description === "[description]" ? 
        TemplateApplicator.generateWorldDescription(template) : state.world.description;
      
      // Apply content level defaults
      state.sexualContentLevel = templateData.defaultContentLevels.sexual;
      state.violentContentLevel = templateData.defaultContentLevels.violent;
      
      // Add custom races and location types if provided
      if (templateData.customRaces) {
        state.customRaces = [...new Set([...(state.customRaces || []), ...templateData.customRaces])];
      }
      if (templateData.locationTypes) {
        state.customLocationTypes = [...new Set([...(state.customLocationTypes || []), ...templateData.locationTypes])];
      }
    });
    
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  const handleCreateCustom = () => {
    setShowTemplateSelector(false);
  };

  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  if (showTemplateSelector) {
    return (
      <WizardStep title="Choose Scenario Template" onNext={onNext} onBack={onBack}>
        <Box mb="6">
          <Text size="4" color="gray">
            Start with a pre-built template or create your own custom scenario from scratch.
          </Text>
        </Box>
        
        <TemplateSelector
          selectedGenre={state.selectedGenre}
          onTemplateSelect={handleTemplateSelect}
          onCreateNew={handleCreateCustom}
        />
      </WizardStep>
    );
  }

  return (
    <WizardStep title="Scenario" onNext={onNext} onBack={onBack}>
      {/* Template Status and Options */}
      <Box mb="6">
        <Flex justify="between" align="center" mb="4">
          <Box>
            {selectedTemplate ? (
              <Flex direction="column" gap="1">
                <Text size="4" weight="bold" color="cyan">
                  Using Template: {selectedTemplate.name}
                </Text>
                <Text size="3" color="gray">
                  {selectedTemplate.description}
                </Text>
              </Flex>
            ) : (
              <Text size="4" color="gray">
                Creating custom scenario
              </Text>
            )}
          </Box>
          <Flex gap="2">
            <Button 
              onClick={handleUseTemplate} 
              variant="outline" 
              size="2"
            >
              <MagicWandIcon />
              Use Template
            </Button>
          </Flex>
        </Flex>
        
        {selectedTemplate && (
          <Card className="p-4 bg-accent-2">
            <Text size="2" style={{color: "var(--accent-contrast)"}}>
              <strong>Template Features:</strong> {selectedTemplate.characterRoles.length} character roles, 
              {selectedTemplate.locationTypes.length} location types
              {selectedTemplate.tags && `, Tags: ${selectedTemplate.tags.join(', ')}`}
            </Text>
          </Card>
        )}
      </Box>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Heading className="lowercase" size="8" color="gold" mb="3">
            World
          </Heading>
          <Box mb="3">
            <Label.Root>
              <Text size="6" color="cyan">
                Name
              </Text>
              <TextField.Root
                value={state.world.name}
                onChange={(event) =>
                  setState((state) => {
                    state.world.name = event.target.value;
                  })
                }
                className="mt-1 text-(length:--font-size-5)"
                size="3"
              />
            </Label.Root>
          </Box>
          <Box>
            <Label.Root>
              <Text size="6" color="cyan">
                Description
              </Text>
              <TextArea
                value={state.world.description}
                onChange={(event) =>
                  setState((state) => {
                    state.world.description = event.target.value;
                  })
                }
                className="mt-1 [&_textarea]:text-(length:--font-size-5)"
                size="3"
                resize="vertical"
              />
            </Label.Root>
          </Box>
        </Box>
        <img
          className="h-64 w-38.5 shadow-(--base-card-surface-box-shadow) rounded-(--radius-4)"
          src="/images/fantasy.png"
          alt="fantasy world"
        />
      </Flex>

      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Heading className="lowercase" size="8" color="gold" mb="3">
            Protagonist
          </Heading>
          <Box mb="3">
            <Label.Root>
              <Text size="6" color="cyan">
                Name
              </Text>
              <TextField.Root
                value={state.protagonist.name}
                onChange={(event) =>
                  setState((state) => {
                    state.protagonist.name = event.target.value;
                  })
                }
                className="mt-1 text-(length:--font-size-5)"
                size="3"
              />
            </Label.Root>
          </Box>
          <Box>
            <Label.Root>
              <Text size="6" color="cyan">
                Biography
              </Text>
              <TextArea
                value={state.protagonist.biography}
                onChange={(event) =>
                  setState((state) => {
                    state.protagonist.biography = event.target.value;
                  })
                }
                className="mt-1 [&_textarea]:text-(length:--font-size-5)"
                size="3"
                resize="vertical"
              />
            </Label.Root>
          </Box>
        </Box>
        <img
          className="h-64 w-38.5 shadow-(--base-card-surface-box-shadow) rounded-(--radius-4)"
          src={`/images/${state.protagonist.gender}-${state.protagonist.race}.png`}
          alt={`${state.protagonist.gender} ${state.protagonist.race}`}
        />
      </Flex>

      <Heading className="lowercase" size="8" color="gold" mb="5">
        Tropes
      </Heading>
      <Box mb="5">
        <Text as="label" size="6">
          <Flex gap="3">
            <Switch
              checked={state.hiddenDestiny}
              onCheckedChange={(checked) =>
                setState((state) => {
                  state.hiddenDestiny = checked;
                })
              }
              className="mt-[0.08em]"
              size="3"
            />
            The protagonist has a hidden destiny, and will gradually uncover it
          </Flex>
        </Text>
      </Box>
      <Box mb="5">
        <Text as="label" size="6">
          <Flex gap="3">
            <Switch
              checked={state.betrayal}
              onCheckedChange={(checked) =>
                setState((state) => {
                  state.betrayal = checked;
                })
              }
              className="mt-[0.08em]"
              size="3"
            />
            The protagonist will eventually be betrayed by someone they trust
          </Flex>
        </Text>
      </Box>
      <Box mb="5">
        <Text as="label" size="6">
          <Flex gap="3">
            <Switch
              checked={state.oppositeSexMagnet}
              onCheckedChange={(checked) =>
                setState((state) => {
                  state.oppositeSexMagnet = checked;
                })
              }
              className="mt-[0.08em]"
              size="3"
            />
            Characters of the opposite sex tend to find the protagonist attractive
          </Flex>
        </Text>
      </Box>
      <Box mb="5">
        <Text as="label" size="6">
          <Flex gap="3">
            <Switch
              checked={state.sameSexMagnet}
              onCheckedChange={(checked) =>
                setState((state) => {
                  state.sameSexMagnet = checked;
                })
              }
              className="mt-[0.08em]"
              size="3"
            />
            Characters of the same sex tend to find the protagonist attractive
          </Flex>
        </Text>
      </Box>

      <Heading className="lowercase" size="8" color="gold" mt="9" mb="5">
        Sexual content
      </Heading>
      <RadioCards.Root
        value={state.sexualContentLevel}
        onValueChange={(value: SexualContentLevel) =>
          setState((state) => {
            state.sexualContentLevel = value;
          })
        }
        columns="3"
      >
        <RadioCards.Item value="regular">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="green" weight="bold">
              Regular
            </Text>
            <Text size="5">
              Write scenes of a sexual nature when the situation calls for it, and describe what happens using language
              typical of mainstream literature
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="explicit">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="orange" weight="bold">
              Explicit
            </Text>
            <Text size="5">
              Write scenes of a sexual nature when the situation calls for it, and describe what happens using explicit
              language
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="actively_explicit">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="crimson" weight="bold">
              <GiBullHorns className="inline mr-[0.3em]" />
              Actively explicit
            </Text>
            <Text size="5">
              Actively work to set up scenes of a sexual nature, even when the situation doesn't require them, and
              describe what happens using explicit language
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>

      <Heading className="lowercase" size="8" color="gold" mt="8" mb="5">
        Violent content
      </Heading>
      <RadioCards.Root
        value={state.violentContentLevel}
        onValueChange={(value: ViolentContentLevel) =>
          setState((state) => {
            state.violentContentLevel = value;
          })
        }
        columns="3"
      >
        <RadioCards.Item value="regular">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="green" weight="bold">
              Regular
            </Text>
            <Text size="5">Describe violence using language typical of mainstream literature</Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="graphic">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="orange" weight="bold">
              Graphic
            </Text>
            <Text size="5">Describe violence in graphic detail</Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="pervasive">
          <Flex direction="column" width="100%" height="100%">
            <Text size="6" color="crimson" weight="bold">
              <GiDrippingBlade className="inline mr-[0.3em]" />
              Pervasive
            </Text>
            <Text size="5">
              Build a dangerous world defined by pervasive violence, and describe it in graphic detail
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>
    </WizardStep>
  );
}
