// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Card, Flex, Grid, Heading, Text, Badge, TextField, Select } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import { MagnifyingGlassIcon, PlusIcon, StarIcon } from "@radix-ui/react-icons";
import type { ScenarioTemplate, Genre } from "@/lib/state";
import { templateManager, TemplateSearch } from "@/lib/scenario-templates";

interface TemplateSelectorProps {
  selectedGenre?: Genre;
  onTemplateSelect: (template: ScenarioTemplate) => void;
  onCreateNew?: () => void;
  className?: string;
}

export default function TemplateSelector({
  selectedGenre,
  onTemplateSelect,
  onCreateNew,
  className = ""
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Get all templates and filter them
  const allTemplates = templateManager.getTemplates();
  const filteredTemplates = useMemo(() => {
    return TemplateSearch.searchTemplates(allTemplates, searchQuery, {
      genre: selectedGenre,
      creator: selectedCreator === "all" ? undefined : selectedCreator,
      tags: selectedTag === "all" ? undefined : [selectedTag]
    });
  }, [allTemplates, searchQuery, selectedGenre, selectedCreator, selectedTag]);

  // Get unique creators and popular tags for filters
  const creators = useMemo(() => {
    const uniqueCreators = Array.from(new Set(allTemplates.map(t => t.creator).filter(Boolean))) as string[];
    return uniqueCreators.sort();
  }, [allTemplates]);

  const popularTags = useMemo(() => {
    return TemplateSearch.getPopularTags(allTemplates).slice(0, 10);
  }, [allTemplates]);

  const handleTemplateClick = (template: ScenarioTemplate) => {
    onTemplateSelect(template);
  };

  return (
    <Box className={className}>
      <Flex direction="column" gap="4">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="6" color="gold">
            Choose Scenario Template
          </Heading>
          {onCreateNew && (
            <Button onClick={onCreateNew} variant="outline" size="2">
              <PlusIcon />
              Create Custom
            </Button>
          )}
        </Flex>

        {/* Search and Filters */}
        <Grid columns="3" gap="3">
          <Box>
            <Text as="label" size="2" color="gray" mb="1">
              Search Templates
            </Text>
            <TextField.Root
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            >
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          <Box>
            <Text as="label" size="2" color="gray" mb="1">
              Creator
            </Text>
            <Select.Root value={selectedCreator} onValueChange={setSelectedCreator}>
              <Select.Trigger placeholder="All Creators" />
              <Select.Content>
                <Select.Item value="all">All Creators</Select.Item>
                {creators.map(creator => (
                  <Select.Item key={creator} value={creator}>
                    {creator}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text as="label" size="2" color="gray" mb="1">
              Tag
            </Text>
            <Select.Root value={selectedTag} onValueChange={setSelectedTag}>
              <Select.Trigger placeholder="All Tags" />
              <Select.Content>
                <Select.Item value="all">All Tags</Select.Item>
                {popularTags.map(({ tag, count }) => (
                  <Select.Item key={tag} value={tag}>
                    {tag} ({count})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>
        </Grid>

        {/* Results Count */}
        <Text size="2" color="gray">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          {selectedGenre && ` for ${selectedGenre}`}
        </Text>

        {/* Template Grid */}
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => handleTemplateClick(template)}
            />
          ))}
        </Grid>

        {/* No Results Message */}
        {filteredTemplates.length === 0 && (
          <Card className="p-8 text-center">
            <Text size="4" color="gray">
              No templates found matching your criteria.
            </Text>
            {onCreateNew && (
              <Button 
                onClick={onCreateNew} 
                variant="outline" 
                size="2" 
                className="mt-4"
              >
                <PlusIcon />
                Create a Custom Template
              </Button>
            )}
          </Card>
        )}
      </Flex>
    </Box>
  );
}

interface TemplateCardProps {
  template: ScenarioTemplate;
  onClick: () => void;
}

function TemplateCard({ template, onClick }: TemplateCardProps) {
  const isOfficial = template.creator === "Waidrin";
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow p-4"
      onClick={onClick}
    >
      <Flex direction="column" gap="3" height="100%">
        {/* Header */}
        <Flex justify="between" align="start">
          <Box flexGrow="1">
            <Heading size="4" color="cyan" mb="1">
              {template.name}
            </Heading>
            <Text size="2" color="gray">
              {template.genre}
            </Text>
          </Box>
          {isOfficial && (
            <Badge color="gold" variant="soft">
              <StarIcon />
              Official
            </Badge>
          )}
        </Flex>

        {/* Description */}
        <Text size="3" style={{ flex: 1 }}>
          {template.description}
        </Text>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <Flex gap="1" wrap="wrap">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="soft" size="1">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="soft" size="1" color="gray">
                +{template.tags.length - 3}
              </Badge>
            )}
          </Flex>
        )}

        {/* Footer Info */}
        <Flex justify="between" align="center" className="pt-2 border-t border-gray-6">
          <Text size="1" color="gray">
            {template.characterRoles.length} roles
          </Text>
          <Text size="1" color="gray">
            {template.locationTypes.length} locations
          </Text>
          {template.creator && template.creator !== "Waidrin" && (
            <Text size="1" color="gray">
              by {template.creator}
            </Text>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}