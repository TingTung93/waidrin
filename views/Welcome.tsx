// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Link, Text } from "@radix-ui/themes";
import WizardStep from "@/components/WizardStep";

export default function Welcome({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  return (
    <WizardStep title="Welcome" onNext={onNext} onBack={onBack}>
      <Box mb="5">
        <Text size="5">
          Dear friend, I am honored that you have decided to try out Waidrin. Your time is precious, so I will get
          straight to the point:
        </Text>
      </Box>
      <Box mb="5">
        <Text size="6" color="amber">
          Waidrin is a <strong>work in progress</strong>, not an actual game (yet).
        </Text>
      </Box>
      <Box mb="5">
        <Text size="5">
          If you are looking for a complete, immersive AI role-playing experience, you will likely be disappointed. If,
          on the other hand, you want to see a glimpse of what the future of AI roleplay might look like, you are in the
          right place!
        </Text>
      </Box>
      <Box mb="5">
        <Text size="5">
          Waidrin is currently missing lots of functionality that you probably take for granted, such as the ability to
          edit messages, to go back to an earlier stage of the game, to regenerate responses you don't like, and
          countless other features. Most of the scenario configuration UI doesn't actually affect the narration yet.
          Perhaps most crucially,{" "}
          <Text color="red">Waidrin does not yet store your progress on the server, but in your browser.</Text> If you
          clear your browsing data, the entire system will reset to its initial state.
        </Text>
      </Box>
      <Box mb="5">
        <Text size="5">
          Note that Waidrin does not itself contain any stories or characters. The entire narration is provided by the
          language model you connect to. If you see something you don't like, changing the model might be your best bet
          to fix it.{" "}
          <Text color="violet">
            Waidrin does <strong>not</strong> write the story, it merely guides the LLM.
          </Text>
        </Text>
      </Box>
      <Box mb="5">
        <Text size="6" color="mint">
          Waidrin needs your help! If you enjoy using Waidrin, and want to contribute to the project to make it even
          better, please <Link href="https://github.com/p-e-w/waidrin/issues">file an issue</Link> describing your idea,
          or, even better, open a pull request.
        </Text>
      </Box>
    </WizardStep>
  );
}
