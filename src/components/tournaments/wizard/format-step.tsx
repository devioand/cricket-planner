"use client";

// "How do you want to play?" — the algorithm choice, shown as detail cards.
// Every format is visible so people can see where the app is heading; only the
// ones the engine can actually run are selectable, the rest read "Soon".

import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import type { TournamentType } from "@/contexts/tournament-context/types";

export interface FormatSpec {
  id: string;
  /** Only set for formats the engine can run — these become the `algorithm`. */
  algorithm?: TournamentType;
  name: string;
  tag: string;
  desc: string;
  available: boolean;
  /** Fewest players this format makes sense for. */
  min: number;
}

export const FORMATS: FormatSpec[] = [
  {
    id: "round-robin",
    algorithm: "round-robin",
    name: "Round-robin",
    tag: "everyone plays everyone",
    desc: "Every side plays every other once — points decide the table. Fair, and everyone gets plenty of game time.",
    available: true,
    min: 3,
  },
  {
    id: "groups-knockout",
    name: "Groups + knockout",
    tag: "group stage, then bracket",
    desc: "Split into groups, then the top sides cross over into a knockout. Best when there's a big turnout.",
    available: false,
    min: 6,
  },
  {
    id: "single-elimination",
    name: "Single elimination",
    tag: "lose once, you're out",
    desc: "A straight knockout bracket. Quick, and every match is do-or-die.",
    available: false,
    min: 4,
  },
  {
    id: "double-elimination",
    name: "Double elimination",
    tag: "two lives",
    desc: "You have to lose twice to go out — a losers' bracket gives everyone a second chance.",
    available: false,
    min: 4,
  },
  {
    id: "series",
    name: "Series",
    tag: "two sides · best of N",
    desc: "Just two sides, best of 3, 5 or 7. Made for a proper rivalry.",
    available: false,
    min: 2,
  },
];

interface FormatStepProps {
  /** id of the selected format. */
  value: string;
  onSelect: (spec: FormatSpec) => void;
}

export function FormatStep({ value, onSelect }: FormatStepProps) {
  return (
    <VStack align="stretch" gap={2.5}>
      {FORMATS.map((f) => (
        <FormatCard
          key={f.id}
          spec={f}
          selected={value === f.id}
          onSelect={() => f.available && onSelect(f)}
        />
      ))}
    </VStack>
  );
}

function FormatCard({
  spec,
  selected,
  onSelect,
}: {
  spec: FormatSpec;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      aria-disabled={!spec.available}
      tabIndex={spec.available ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (spec.available && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      p={4}
      borderWidth={selected ? 2 : 1}
      borderRadius="xl"
      colorPalette="brand"
      borderColor={selected ? "colorPalette.500" : "border.default"}
      bg={selected ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
      cursor={spec.available ? "pointer" : "not-allowed"}
      opacity={spec.available ? 1 : 0.62}
      transition="all 0.15s"
      _hover={
        spec.available && !selected ? { borderColor: "colorPalette.300" } : {}
      }
    >
      <VStack align="stretch" gap={1.5}>
        <HStack justify="space-between" align="center" gap={2}>
          <Text
            fontFamily="heading"
            fontWeight="bold"
            fontSize="md"
            color="fg.default"
          >
            {spec.name}
          </Text>
          {spec.available ? (
            selected ? (
              <Box color="colorPalette.500" display="flex" flexShrink={0}>
                <LuCheck size={18} />
              </Box>
            ) : null
          ) : (
            <Badge
              colorPalette="gray"
              variant="subtle"
              fontSize="2xs"
              flexShrink={0}
            >
              Soon
            </Badge>
          )}
        </HStack>
        <Text
          fontSize="2xs"
          fontWeight="medium"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="colorPalette.fg"
        >
          {spec.tag}
        </Text>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.45">
          {spec.desc}
        </Text>
      </VStack>
    </Box>
  );
}
