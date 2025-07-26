// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import type React from "react";
import { GiBigGear, GiCog, GiCogLock, GiPokecog, GiStarSattelites } from "react-icons/gi";

export default function ProcessingOverlay({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Flex
      className="fixed top-0 right-0 bottom-0 left-0 bg-[color-mix(in_srgb,var(--color-background)_95%,transparent)]"
      justify="center"
      align="center"
    >
      <Flex direction="column" align="center">
        <Flex align="center" mb="4">
          <GiBigGear className="animate-[spin_5s_linear_infinite]" size="50" color="var(--gold-8)" />
          <GiPokecog className="animate-[spin_5s_linear_reverse_infinite]" size="50" color="var(--brown-8)" />
          <GiStarSattelites className="animate-[spin_5s_linear_infinite]" size="70" color="var(--gray-11)" />
          <GiCog className="animate-[spin_5s_linear_reverse_infinite]" size="50" color="var(--bronze-8)" />
          <GiCogLock className="animate-[spin_5s_linear_infinite]" size="50" color="var(--gray-8)" />
        </Flex>

        <Heading className="lowercase" size="8" color="gold" mb="4">
          {title}
        </Heading>
        <Flex direction="column" align="center">
          {children}
        </Flex>

        {onCancel && (
          <Button variant="classic" color="red" size="4" mt="6" onClick={onCancel}>
            <Text size="6">Cancel</Text>
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
