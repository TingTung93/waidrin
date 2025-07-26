// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Flex, Heading, Text } from "@radix-ui/themes";
import { useShallow } from "zustand/shallow";
import { type LocationChangeEvent, useStateStore } from "@/lib/state";

export default function LocationChangeEventView({ event }: { event: LocationChangeEvent }) {
  const { location } = useStateStore(
    useShallow((state) => ({
      location: state.locations[event.locationIndex],
    })),
  );

  return (
    <Flex direction="column" width="100%">
      <img src={`/images/${location.type}.png`} alt={location.type} />

      <Flex className="bg-(--orange-2)" direction="column" p="6">
        <Heading className="lowercase" size="7" color="orange" align="center" mb="5">
          {location.name}
        </Heading>
        <Text
          className="first-letter:float-left first-letter:mr-2 first-letter:text-[350%] first-letter:mt-[0.11em] first-line:tracking-wider first-line:uppercase"
          size="5"
          color="bronze"
        >
          {location.description}
        </Text>
      </Flex>
    </Flex>
  );
}
