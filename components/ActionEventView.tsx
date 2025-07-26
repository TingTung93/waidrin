// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Text } from "@radix-ui/themes";
import type { ActionEvent } from "@/lib/state";

export default function ActionEventView({ event }: { event: ActionEvent }) {
  return (
    <Box className="bg-(--sky-1)" width="100%" p="6">
      <Text size="6" color="gray">
        {event.action}
      </Text>
    </Box>
  );
}
