// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, HoverCard, Link, Text } from "@radix-ui/themes";
import { useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { useShallow } from "zustand/shallow";
import { type NarrationEvent, useStateStore } from "@/lib/state";
import CharacterView from "./CharacterView";

export default function NarrationEventView({ event }: { event: NarrationEvent }) {
  const { characters } = useStateStore(
    useShallow((state) => ({
      characters: state.characters,
    })),
  );

  // Hack to highlight dialogue in text:
  //
  // 1. Surround quoted portions of text with asterisks, marking them as italics.
  // 2. Use a custom <em> component (see below) to render italics as dialogue
  //    if they start with quotation marks.
  //
  // It would be cleaner to use a dedicated semantic element instead (e.g. <span class="...">),
  // but that requires enabling HTML support in react-markdown, which is a security risk.
  const markdown = event.text.replaceAll(/".*?(?:"|$)/g, "*$&*");

  const NameView = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: The correct type is private in react-markdown.
    (props: any) => {
      const { children } = props;

      if (typeof children === "string") {
        const possessiveSuffix = /'s?$/;
        const name = children.replace(possessiveSuffix, "");

        for (const character of characters) {
          if (character.name === name || character.name.split(" ")[0] === name) {
            return (
              <HoverCard.Root>
                <HoverCard.Trigger>
                  <Link color="blue" href="#" onClick={(event) => event.preventDefault()}>
                    {children}
                  </Link>
                </HoverCard.Trigger>
                <HoverCard.Content maxWidth="40rem">
                  <Box p="2">
                    <CharacterView character={character} />
                  </Box>
                </HoverCard.Content>
              </HoverCard.Root>
            );
          }
        }
      }

      return <strong>{children}</strong>;
    },
    [characters],
  );

  const DialogueView = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: The correct type is private in react-markdown.
    (props: any) => {
      const { children } = props;

      const firstChild = Array.isArray(children) && children.length > 0 ? children[0] : children;

      if (typeof firstChild === "string" && firstChild.startsWith('"')) {
        return <Text color="amber">{children}</Text>;
      } else {
        return <em>{children}</em>;
      }
    },
    [],
  );

  const components = useMemo(
    () => ({
      strong: NameView,
      em: DialogueView,
    }),
    [NameView, DialogueView],
  );

  return (
    <Box className="text-(length:--font-size-5) [&_p]:mb-[0.7em]" width="100%" p="6">
      <Markdown components={components}>{markdown}</Markdown>
    </Box>
  );
}
