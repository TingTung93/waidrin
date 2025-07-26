// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Flex, Text } from "@radix-ui/themes";

export default function ErrorBar({
  errorMessage,
  onRetry,
  onCancel,
}: {
  errorMessage: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <Flex className="bg-(--red-2) border-t border-(--red-7)" align="center" width="100%" px="3" py="2" gap="2">
      <Text size="5" color="red" weight="bold">
        Error
      </Text>
      <Box flexGrow="1">
        <Text size="5">{errorMessage}</Text>
      </Box>

      <Button variant="surface" color="gray" size="2" onClick={onCancel}>
        <Text size="5">Cancel</Text>
      </Button>
      <Button variant="surface" color="sky" size="2" onClick={onRetry}>
        <Text size="5">Retry</Text>
      </Button>
    </Flex>
  );
}
