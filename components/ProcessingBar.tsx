// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { GiBigGear } from "react-icons/gi";

export default function ProcessingBar({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <Flex className="bg-(--gold-2) border-t border-(--gold-7)" align="center" width="100%" px="3" py="2" gap="2">
      <GiBigGear className="animate-[spin_5s_linear_infinite]" size="25" color="var(--gold-9)" />
      <Text size="5">{title}...</Text>
      <Box flexGrow="1">{children}</Box>

      <Button variant="surface" color="red" size="2" onClick={onCancel}>
        <Text size="5">Cancel</Text>
      </Button>
    </Flex>
  );
}
