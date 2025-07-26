// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box } from "@radix-ui/themes";
import { useShallow } from "zustand/shallow";
import { type CharacterIntroductionEvent, useStateStore } from "@/lib/state";
import CharacterView from "./CharacterView";

export default function CharacterIntroductionEventView({ event }: { event: CharacterIntroductionEvent }) {
  const { character } = useStateStore(
    useShallow((state) => ({
      character: state.characters[event.characterIndex],
    })),
  );

  return (
    <Box className="bg-(--jade-2)" width="100%" p="6">
      <CharacterView character={character} />
    </Box>
  );
}
