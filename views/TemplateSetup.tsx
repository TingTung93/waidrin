// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Flex, Heading, Button } from "@radix-ui/themes";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import WizardStep from "@/components/WizardStep";
import TemplateSelector from "@/components/TemplateSelector";
import TemplatePreview from "@/components/TemplatePreview";
import { useStateStore, type ScenarioTemplate } from "@/lib/state";
import { applyTemplateToState } from "@/lib/template-integration";

export default function TemplateSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { state, setState } = useStateStore(
    useShallow((state) => ({
      state: state,
      setState: state.set,
    })),
  );

  const [selectedTemplate, setSelectedTemplate] = useState<ScenarioTemplate | null>(
    state.scenarioTemplate || null
  );
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateSelect = (template: ScenarioTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    setState((state) => {
      const updates = applyTemplateToState(selectedTemplate, state);
      Object.assign(state, updates);
    });

    setShowPreview(false);
    onNext?.();
  };

  const handleSkipTemplate = () => {
    // Clear any existing template
    setState((state) => {
      state.scenarioTemplate = undefined;
    });
    onNext?.();
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setSelectedTemplate(state.scenarioTemplate || null);
  };

  if (showPreview && selectedTemplate) {
    return (
      <WizardStep title="Template Preview">
        <TemplatePreview
          template={selectedTemplate}
          onApply={handleApplyTemplate}
          onCancel={handleCancelPreview}
        />
      </WizardStep>
    );
  }

  return (
    <WizardStep 
      title="Choose Template" 
      onNext={selectedTemplate ? handleApplyTemplate : undefined}
      onBack={onBack}
    >
      <Flex direction="column" gap="4">
        {/* Introduction */}
        <Box mb="4">
          <Heading size="5" color="cyan" mb="2">
            Enhance Your Adventure
          </Heading>
          <Box className="text-gray-11 leading-relaxed">
            Choose a scenario template to automatically configure your world settings, available locations, 
            character roles, and content preferences. Templates provide rich, detailed settings that enhance 
            your roleplay experience.
          </Box>
          {state.selectedGenre && (
            <Box className="mt-3 p-3 bg-blue-2 rounded">
              <Box className="text-sm text-blue-11">
                Showing templates for <strong>{state.selectedGenre}</strong> genre. 
                You can still choose templates from other genres if desired.
              </Box>
            </Box>
          )}
        </Box>

        {/* Template Selector */}
        <TemplateSelector
          selectedGenre={state.selectedGenre}
          onTemplateSelect={handleTemplateSelect}
          onCreateNew={() => {
            // TODO: Implement custom template creator
            console.log("Create new template - to be implemented");
          }}
        />

        {/* Current Selection */}
        {selectedTemplate && (
          <Box className="mt-6 p-4 bg-cyan-2 rounded">
            <Flex justify="between" align="center">
              <Box>
                <Heading size="4" color="cyan" mb="1">
                  Selected: {selectedTemplate.name}
                </Heading>
                <Box className="text-sm text-cyan-11">
                  {selectedTemplate.description}
                </Box>
              </Box>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(true)}
              >
                Preview
              </Button>
            </Flex>
          </Box>
        )}

        {/* Help Text */}
        <Box className="mt-6 p-4 bg-gray-2 rounded">
          <Heading size="3" color="gray" mb="2">
            Tips
          </Heading>
          <Box className="text-sm text-gray-11 space-y-2">
            <Box>• Templates provide default settings but can be customized later</Box>
            <Box>• You can skip templates and build your scenario from scratch</Box>
            <Box>• Official templates are tested and balanced for great experiences</Box>
            <Box>• Custom templates can be created and shared with others</Box>
          </Box>
        </Box>
      </Flex>
    </WizardStep>
  );
}