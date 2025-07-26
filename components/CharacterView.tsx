// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Flex, Heading, Text } from "@radix-ui/themes";
import type { Character } from "@/lib/state";

export default function CharacterView({ character }: { character: Character }) {
  return (
    <Flex width="100%" gap="6">
      <img
        className="h-48 w-28.875 shadow-(--base-card-surface-box-shadow) rounded-(--radius-4)"
        src={`/images/${character.gender}-${character.race}.png`}
        alt={`${character.gender} ${character.race}`}
      />

      <Flex direction="column" flexGrow="1">
        <Heading className="mt-[-0.2em] lowercase" size="7" weight="regular" color="lime" mb="4">
          {character.name}
        </Heading>
        <Text size="5" color="gray">
          {character.biography}
        </Text>
      </Flex>
    </Flex>
  );
}
