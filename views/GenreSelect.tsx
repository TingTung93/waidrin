// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Flex, RadioCards, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import ImageOption from "@/components/ImageOption";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";
import type { Genre } from "@/lib/state";

const genreOptions = [
  {
    value: "fantasy" as Genre,
    title: "Fantasy",
    description: "Elves, dwarves, and wizards",
    image: "fantasy"
  },
  {
    value: "scifi" as Genre,
    title: "Sci-Fi", 
    description: "Spaceships and aliens",
    image: "scifi"
  },
  {
    value: "modern" as Genre,
    title: "Modern",
    description: "Contemporary urban settings",
    image: "reality"
  },
  {
    value: "horror" as Genre,
    title: "Horror",
    description: "Dark and terrifying tales",
    image: "fantasy", // Using fantasy as fallback until horror.png is added
    fallbackColor: "from-red-900 to-black"
  },
  {
    value: "romance" as Genre,
    title: "Romance",
    description: "Love and relationships",
    image: "fantasy", // Using fantasy as fallback until romance.png is added
    fallbackColor: "from-pink-500 to-rose-600"
  },
  {
    value: "historical" as Genre,
    title: "Historical",
    description: "Past eras and civilizations",
    image: "fantasy", // Using fantasy as fallback until historical.png is added
    fallbackColor: "from-amber-700 to-orange-800"
  }
];

export default function GenreSelect({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { selectedGenre, customGenre, set } = useStateStore();
  const [customGenreInput, setCustomGenreInput] = useState(customGenre || "");
  const [showCustomInput, setShowCustomInput] = useState(selectedGenre === "custom");
  const [validationError, setValidationError] = useState("");

  const handleGenreChange = (value: string) => {
    const genre = value as Genre;
    setValidationError("");
    
    if (genre === "custom") {
      setShowCustomInput(true);
      set((state) => {
        state.selectedGenre = genre;
        state.customGenre = customGenreInput.trim() || undefined;
      });
    } else {
      setShowCustomInput(false);
      set((state) => {
        state.selectedGenre = genre;
        state.customGenre = undefined;
      });
    }
  };

  const handleCustomGenreChange = (value: string) => {
    setCustomGenreInput(value);
    setValidationError("");
    
    // Validate custom genre input
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      if (trimmed.length < 2) {
        setValidationError("Genre name must be at least 2 characters");
      } else if (trimmed.length > 50) {
        setValidationError("Genre name must be less than 50 characters");
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        setValidationError("Genre name can only contain letters, numbers, spaces, hyphens, and underscores");
      } else {
        // Valid custom genre
        set((state) => {
          state.customGenre = trimmed;
        });
      }
    } else if (selectedGenre === "custom") {
      set((state) => {
        state.customGenre = undefined;
      });
    }
  };

  const isNextDisabled = () => {
    if (selectedGenre === "custom") {
      return !customGenre || validationError !== "" || customGenreInput.trim().length < 2;
    }
    return false;
  };

  const handleNext = () => {
    if (!isNextDisabled() && onNext) {
      onNext();
    }
  };

  return (
    <WizardStep title="Choose Your Genre" onNext={handleNext} onBack={onBack} nextDisabled={isNextDisabled()}>
      <RadioCards.Root 
        value={selectedGenre} 
        onValueChange={handleGenreChange}
        columns="3"
      >
        {genreOptions.map((genre) => (
          <ImageOption
            key={genre.value}
            title={genre.title}
            description={genre.description}
            image={genre.image}
            value={genre.value}
          />
        ))}
        
        {/* Custom Genre Option */}
        <RadioCards.Item
          className="flex items-center justify-center h-128 w-77 bg-gradient-to-br from-purple-600 to-blue-600 p-0"
          value="custom"
        >
          <Flex direction="column" align="center" gap="2" className="p-5">
            <Text size="7" weight="bold" style={{color: "white"}}>
              Custom
            </Text>
            <Text size="6" style={{color: "white"}} align="center">
              Create your own genre
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>

      {/* Custom Genre Input */}
      {showCustomInput && (
        <Box mt="5">
          <Flex direction="column" gap="2">
            <Text size="3" weight="medium">
              Enter your custom genre:
            </Text>
            <TextField.Root
              placeholder="e.g., Steampunk, Cyberpunk, Space Opera..."
              value={customGenreInput}
              onChange={(e) => handleCustomGenreChange(e.target.value)}
              size="3"
            />
            {validationError && (
              <Text size="2" color="red">
                {validationError}
              </Text>
            )}
            {customGenre && !validationError && (
              <Text size="2" color="green">
                ✓ Custom genre "{customGenre}" is ready
              </Text>
            )}
          </Flex>
        </Box>
      )}

      <Box mt="5">
        <Text as="div" align="center" size="3" color="gray">
          {selectedGenre === "custom" && customGenre ? (
            <>Your custom genre <strong>"{customGenre}"</strong> will shape the world and characters.</>
          ) : selectedGenre !== "fantasy" ? (
            <>The <strong>{genreOptions.find(g => g.value === selectedGenre)?.title || selectedGenre}</strong> genre will influence the story, characters, and settings.</>
          ) : (
            <>The <strong>Fantasy</strong> genre offers magical worlds with diverse races and mystical elements.</>
          )}
        </Text>
      </Box>
    </WizardStep>
  );
}
