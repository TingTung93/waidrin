// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Card, Flex, RadioCards, SegmentedControl, Tabs, Text, TextArea, TextField } from "@radix-ui/themes";
import { useState, useRef, useCallback } from "react";
import { GiFemale, GiMale } from "react-icons/gi";
import { FiUpload, FiFileText, FiImage, FiUser } from "react-icons/fi";
import { useShallow } from "zustand/shallow";
import ImageOption from "@/components/ImageOption";
import WizardStep from "@/components/WizardStep";
import { type Gender, type Race, type Character, useStateStore } from "@/lib/state";
import { 
  parseCharacterCard, 
  importFromPNG, 
  generateCharacterSummary,
  type CharacterCardImportResult 
} from "@/lib/character-cards";

export default function CharacterSelect({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { gender, race, protagonist, setState } = useStateStore(
    useShallow((state) => ({
      gender: state.protagonist.gender,
      race: state.protagonist.race,
      protagonist: state.protagonist,
      setState: state.set,
    })),
  );

  const [creationMode, setCreationMode] = useState<"traditional" | "import">("traditional");
  const [importedCharacter, setImportedCharacter] = useState<Character | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [customRace, setCustomRace] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const file = files[0];
      let result: CharacterCardImportResult;

      if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
        result = await importFromPNG(file);
      } else if (file.type === "application/json" || file.name.toLowerCase().endsWith(".json")) {
        const text = await file.text();
        result = parseCharacterCard(text);
      } else {
        result = {
          success: false,
          error: "Unsupported file type. Please use JSON or PNG files.",
        };
      }

      if (result.success && result.character) {
        setImportedCharacter(result.character);
        setImportError(null);
        
        // Update protagonist with imported character data
        setState((state) => {
          state.protagonist = {
            ...state.protagonist,
            ...result.character,
            locationIndex: state.protagonist.locationIndex, // Keep current location
          };
        });
      } else {
        setImportError(result.error || "Failed to import character card");
        setImportedCharacter(null);
      }
    } catch (error) {
      setImportError(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
      setImportedCharacter(null);
    } finally {
      setIsImporting(false);
    }
  }, [setState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileImport(e.dataTransfer.files);
  }, [handleFileImport]);

  const renderTraditionalCreation = () => (
    <>
      <SegmentedControl.Root
        value={gender}
        onValueChange={(value: Gender) =>
          setState((state) => {
            state.protagonist.gender = value;
          })
        }
        className="w-full"
        size="3"
        mb="5"
      >
        <SegmentedControl.Item value="male">
          <GiMale className="inline mt-[-7px]" size="25" /> <Text size="6">Male</Text>
        </SegmentedControl.Item>
        <SegmentedControl.Item value="female">
          <GiFemale className="inline mt-[-7px]" size="25" /> <Text size="6">Female</Text>
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      <RadioCards.Root
        value={race === "custom" && customRace ? "custom" : race}
        onValueChange={(value: Race | "custom") => {
          setState((state) => {
            if (value === "custom") {
              state.protagonist.race = "custom";
            } else {
              state.protagonist.race = value as Race;
              setCustomRace("");
            }
          });
        }}
        columns="3"
        mb="4"
      >
        <ImageOption title="Human" image={`${gender}-human`} value="human" />
        <ImageOption title="Elf" image={`${gender}-elf`} value="elf" />
        <ImageOption title="Dwarf" image={`${gender}-dwarf`} value="dwarf" />
        <RadioCards.Item value="custom" className="p-4">
          <Flex direction="column" align="center" justify="center" height="100%">
            <FiUser size="24" className="mb-2" />
            <Text size="6" weight="bold">Custom Race</Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>

      {race === "custom" && (
        <Box mb="4">
          <TextField.Root
            placeholder="Enter custom race (e.g., Orc, Dragon, Android)"
            value={customRace}
            onChange={(e) => {
              setCustomRace(e.target.value);
              setState((state) => {
                state.protagonist.customRace = e.target.value;
              });
            }}
          >
            <TextField.Slot>
              <FiUser size="16" />
            </TextField.Slot>
          </TextField.Root>
        </Box>
      )}
    </>
  );

  const renderCharacterImport = () => (
    <Box>
      <Card
        className="border-dashed border-2 border-gray-300 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.png,.txt"
          onChange={(e) => handleFileImport(e.target.files)}
          className="hidden"
        />
        
        <Flex direction="column" align="center" gap="3">
          <FiUpload size="32" className="text-gray-400" />
          <Text size="6" weight="bold">Import Character Card</Text>
          <Text size="4" color="gray">
            Drag and drop or click to select JSON or PNG files
          </Text>
          <Text size="3" color="gray">
            Supports SillyTavern character cards (v2)
          </Text>
        </Flex>
      </Card>

      {isImporting && (
        <Box mt="4" className="text-center">
          <Text size="4">Importing character...</Text>
        </Box>
      )}

      {importError && (
        <Box mt="4" p="3" className="bg-red-50 border border-red-200 rounded">
          <Text size="4" color="red">{importError}</Text>
        </Box>
      )}

      {importedCharacter && (
        <Box mt="4">
          <Card style={{padding: "16px"}}>
            <Flex direction="column" gap="3">
              <Text size="6" weight="bold">Character Preview</Text>
              
              <Box>
                <Text size="4" weight="medium">Name:</Text>
                <Text size="4" ml="2">{importedCharacter.name}</Text>
              </Box>
              
              <Box>
                <Text size="4" weight="medium">Gender:</Text>
                <Text size="4" ml="2" className="capitalize">{importedCharacter.gender}</Text>
              </Box>
              
              <Box>
                <Text size="4" weight="medium">Race:</Text>
                <Text size="4" ml="2" className="capitalize">
                  {importedCharacter.race === "custom" && importedCharacter.customRace
                    ? importedCharacter.customRace
                    : importedCharacter.race}
                </Text>
              </Box>
              
              <Box>
                <Text size="4" weight="medium">Description:</Text>
                <TextArea
                  value={importedCharacter.biography}
                  readOnly
                  rows={4}
                  className="mt-2"
                />
              </Box>

              {importedCharacter.personality && (
                <Box>
                  <Text size="4" weight="medium">Personality:</Text>
                  <TextArea
                    value={importedCharacter.personality}
                    readOnly
                    rows={3}
                    className="mt-2"
                  />
                </Box>
              )}

              {importedCharacter.tags && importedCharacter.tags.length > 0 && (
                <Box>
                  <Text size="4" weight="medium">Tags:</Text>
                  <Text size="4" ml="2">{importedCharacter.tags.join(", ")}</Text>
                </Box>
              )}

              {importedCharacter.creator && (
                <Box>
                  <Text size="4" weight="medium">Creator:</Text>
                  <Text size="4" ml="2">{importedCharacter.creator}</Text>
                </Box>
              )}

              <Box className="bg-blue-50 p-3 rounded">
                <Text size="3" color="blue">
                  Character card successfully imported! You can proceed to the next step.
                </Text>
              </Box>
            </Flex>
          </Card>
        </Box>
      )}
    </Box>
  );

  return (
    <WizardStep title="Character" onNext={onNext} onBack={onBack}>
      <Tabs.Root value={creationMode} onValueChange={(value) => setCreationMode(value as "traditional" | "import")}>
        <Tabs.List mb="4">
          <Tabs.Trigger value="traditional">
            <FiUser className="mr-2" />
            Traditional Creation
          </Tabs.Trigger>
          <Tabs.Trigger value="import">
            <FiFileText className="mr-2" />
            Import Character Card
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="traditional">
          {renderTraditionalCreation()}
        </Tabs.Content>

        <Tabs.Content value="import">
          {renderCharacterImport()}
        </Tabs.Content>
      </Tabs.Root>
    </WizardStep>
  );
}
