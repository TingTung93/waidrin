// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Card, Flex, Heading, Text, Badge, ScrollArea, Separator } from "@radix-ui/themes";
import { FiX, FiCheck } from "react-icons/fi";
import type { ScenarioTemplate } from "@/lib/state";

interface TemplatePreviewProps {
  template: ScenarioTemplate;
  onApply: () => void;
  onCancel: () => void;
  className?: string;
}

export default function TemplatePreview({
  template,
  onApply,
  onCancel,
  className = ""
}: TemplatePreviewProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <Flex direction="column" gap="6" height="100%">
        {/* Header */}
        <Flex justify="between" align="start">
          <Box>
            <Heading size="6" color="cyan" mb="2">
              {template.name}
            </Heading>
            <Flex gap="2" align="center">
              <Badge color="gold">{template.genre}</Badge>
              {template.version && (
                <Badge variant="soft">v{template.version}</Badge>
              )}
              {template.creator && (
                <Badge variant="soft">by {template.creator}</Badge>
              )}
            </Flex>
          </Box>
          <Button variant="ghost" size="1" onClick={onCancel}>
            <FiX />
          </Button>
        </Flex>

        {/* Description */}
        <Box>
          <Heading size="4" color="gold" mb="2">
            Description
          </Heading>
          <Text size="3">
            {template.description}
          </Text>
        </Box>

        {/* World Setting */}
        <Box>
          <Heading size="4" color="gold" mb="2">
            World Setting
          </Heading>
          <ScrollArea style={{ height: 120 }}>
            <Text size="3" style={{ lineHeight: 1.6 }}>
              {template.worldPrompt}
            </Text>
          </ScrollArea>
        </Box>

        <Separator />

        {/* Content in two columns */}
        <Flex gap="6">
          {/* Left Column: Location Types */}
          <Box flexGrow="1">
            <Heading size="4" color="gold" mb="3">
              Location Types ({template.locationTypes.length})
            </Heading>
            <ScrollArea style={{ height: 150 }}>
              <Flex direction="column" gap="1">
                {template.locationTypes.map((location, index) => (
                  <Box key={index} className="p-2 bg-gray-2 rounded">
                    <Text size="2" style={{ textTransform: 'capitalize' }}>
                      {location.replace(/[-_]/g, ' ')}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          </Box>

          {/* Right Column: Character Roles */}
          <Box flexGrow="1">
            <Heading size="4" color="gold" mb="3">
              Character Roles ({template.characterRoles.length})
            </Heading>
            <ScrollArea style={{ height: 150 }}>
              <Flex direction="column" gap="1">
                {template.characterRoles.map((role, index) => (
                  <Box key={index} className="p-2 bg-gray-2 rounded">
                    <Text size="2" style={{ textTransform: 'capitalize' }}>
                      {role.replace(/[-_]/g, ' ')}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          </Box>
        </Flex>

        {/* Custom Options */}
        {(template.customRaces?.length || template.customGenders?.length) && (
          <>
            <Separator />
            <Flex gap="6">
              {template.customRaces && template.customRaces.length > 0 && (
                <Box flexGrow="1">
                  <Heading size="4" color="gold" mb="3">
                    Custom Races ({template.customRaces.length})
                  </Heading>
                  <Flex wrap="wrap" gap="1">
                    {template.customRaces.map((race, index) => (
                      <Badge key={index} variant="soft" size="2">
                        {race}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}

              {template.customGenders && template.customGenders.length > 0 && (
                <Box flexGrow="1">
                  <Heading size="4" color="gold" mb="3">
                    Gender Options ({template.customGenders.length})
                  </Heading>
                  <Flex wrap="wrap" gap="1">
                    {template.customGenders.map((gender, index) => (
                      <Badge key={index} variant="soft" size="2">
                        {gender}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              )}
            </Flex>
          </>
        )}

        {/* Content Levels */}
        {(template.defaultSexualContent || template.defaultViolentContent) && (
          <>
            <Separator />
            <Box>
              <Heading size="4" color="gold" mb="3">
                Default Content Levels
              </Heading>
              <Flex gap="4">
                {template.defaultSexualContent && (
                  <Box>
                    <Text as="label" size="2" color="gray" mb="1">
                      Sexual Content
                    </Text>
                    <Badge 
                      color={
                        template.defaultSexualContent === "regular" ? "green" :
                        template.defaultSexualContent === "explicit" ? "orange" : "red"
                      }
                    >
                      {template.defaultSexualContent.replace('_', ' ')}
                    </Badge>
                  </Box>
                )}
                {template.defaultViolentContent && (
                  <Box>
                    <Text as="label" size="2" color="gray" mb="1">
                      Violent Content
                    </Text>
                    <Badge 
                      color={
                        template.defaultViolentContent === "regular" ? "green" :
                        template.defaultViolentContent === "graphic" ? "orange" : "red"
                      }
                    >
                      {template.defaultViolentContent}
                    </Badge>
                  </Box>
                )}
              </Flex>
            </Box>
          </>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <>
            <Separator />
            <Box>
              <Heading size="4" color="gold" mb="3">
                Tags
              </Heading>
              <Flex wrap="wrap" gap="2">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="soft" size="2">
                    {tag}
                  </Badge>
                ))}
              </Flex>
            </Box>
          </>
        )}

        {/* Action Buttons */}
        <Separator />
        <Flex justify="end" gap="3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onApply}>
            <FiCheck />
            Apply Template
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}