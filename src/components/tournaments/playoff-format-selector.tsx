"use client";

import { Box, Text, VStack, HStack, Badge, Card } from "@chakra-ui/react";
import { LuCheck, LuTable2, LuTrophy, LuSettings2 } from "react-icons/lu";
import type { PlayoffFormat } from "@/contexts/tournament-context/types";
import WorldCupTrophyIcon from "../icons/world-cup-trophy-icon";
import LeagueTrophyIcon from "../icons/league-trophy-icon";

interface FormatDetail {
  name: string;
  tag: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  /** Minimum team count this format needs. */
  minTeams: number;
  /** Bracket stages, or null for "no knockout". */
  stages: readonly string[] | null;
}

const FORMAT_ORDER: PlayoffFormat[] = [
  "none",
  "final-only",
  "world-cup",
  "league",
  "custom",
];

const FORMAT_DETAILS: Record<PlayoffFormat, FormatDetail> = {
  none: {
    name: "No Playoffs",
    tag: "League table",
    description: "Champion is whoever tops the round-robin table",
    icon: <LuTable2 size={22} />,
    color: "gray",
    minTeams: 2,
    stages: ["Final standings decide the winner — no knockout"],
  },
  "final-only": {
    name: "Final Only",
    tag: "Top 2",
    description: "The top two teams play a single final",
    icon: <LuTrophy size={22} />,
    color: "teal",
    minTeams: 2,
    stages: ["Final: 1st vs 2nd (→ Champion)"],
  },
  "world-cup": {
    name: "World Cup Style",
    tag: "ICC · T20 WC",
    description: "Simple knockout — no second chances",
    icon: <WorldCupTrophyIcon width={22} height={22} />,
    color: "blue",
    minTeams: 4,
    stages: [
      "Semi-Final 1: 1st vs 4th",
      "Semi-Final 2: 2nd vs 3rd",
      "Final: Winner SF1 vs Winner SF2 (→ Champion)",
    ],
  },
  league: {
    name: "League Style",
    tag: "IPL · BBL · PSL",
    description: "Top two get a second chance",
    icon: <LeagueTrophyIcon width={22} height={22} />,
    color: "purple",
    minTeams: 4,
    stages: [
      "Qualifier 1: 1st vs 2nd (Winner → Final)",
      "Eliminator: 3rd vs 4th (Loser out)",
      "Qualifier 2: Loser Q1 vs Winner Eliminator",
      "Final: Winner Q1 vs Winner Q2 (→ Champion)",
    ],
  },
  custom: {
    name: "Custom",
    tag: "Build your own",
    description: "Design the bracket — qualifiers, eliminators & final",
    icon: <LuSettings2 size={22} />,
    color: "orange",
    minTeams: 3,
    stages: null,
  },
};

/** The sensible default format for a given team count. */
export function recommendedPlayoffFormat(teamCount: number): PlayoffFormat {
  if (teamCount >= 4) return "world-cup";
  return "final-only";
}

interface PlayoffFormatSelectorProps {
  value: PlayoffFormat;
  onChange: (format: PlayoffFormat) => void;
  disabled?: boolean;
  /** Team count — formats needing more teams are disabled. */
  teamCount?: number;
  /** Format to badge as "Recommended". */
  recommended?: PlayoffFormat;
}

export function PlayoffFormatSelector({
  value,
  onChange,
  disabled = false,
  teamCount = Infinity,
  recommended,
}: PlayoffFormatSelectorProps) {
  return (
    <VStack align="stretch" gap={3} role="radiogroup" aria-label="Playoff format">
      {FORMAT_ORDER.map((format) => {
        const details = FORMAT_DETAILS[format];
        const notEnoughTeams = teamCount < details.minTeams;
        const isDisabled = disabled || notEnoughTeams;
        const isSelected = value === format;

        // Explicit light/dark color pairs from the raw palette scales. We avoid
        // this theme's `colorPalette.*` semantic tokens for tinted backgrounds
        // because their low shades don't invert reliably in dark mode.
        const c = details.color;
        const tintBg = { base: `${c}.50`, _dark: `${c}.950` };
        const solidBorder = `${c}.500`;
        const hoverBorder = { base: `${c}.300`, _dark: `${c}.600` };
        const chipBg = { base: `${c}.100`, _dark: `${c}.900` };
        const iconColor = { base: `${c}.600`, _dark: `${c}.300` };
        const numColor = { base: `${c}.700`, _dark: `${c}.300` };

        return (
          <Card.Root
            key={format}
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled || undefined}
            tabIndex={isDisabled ? -1 : 0}
            w="full"
            borderWidth={2}
            borderRadius="xl"
            borderColor={isSelected ? solidBorder : "border.default"}
            bg={isSelected ? tintBg : "card.bg"}
            cursor={isDisabled ? "not-allowed" : "pointer"}
            opacity={isDisabled ? 0.5 : 1}
            transition="border-color 0.15s ease, background 0.15s ease"
            onClick={() => !isDisabled && onChange(format)}
            onKeyDown={(e) => {
              if (isDisabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(format);
              }
            }}
            _hover={
              !isDisabled && !isSelected
                ? { borderColor: hoverBorder, bg: "bg.subtle" }
                : {}
            }
            _focusVisible={{
              outline: "2px solid",
              outlineColor: solidBorder,
              outlineOffset: "2px",
            }}
          >
            <Card.Body p={{ base: 4, md: 5 }}>
              <VStack align="stretch" gap={3.5}>
                {/* Header */}
                <HStack justify="space-between" align="flex-start" gap={3}>
                  <HStack gap={3} align="center">
                    {/* Icon tile */}
                    <Box
                      flexShrink={0}
                      p={2.5}
                      borderRadius="lg"
                      bg={chipBg}
                      color={iconColor}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {details.icon}
                    </Box>
                    <VStack align="start" gap={0.5}>
                      <HStack gap={2} align="center" flexWrap="wrap">
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          color="fg.default"
                          lineHeight="1.2"
                        >
                          {details.name}
                        </Text>
                        <Badge
                          colorPalette={details.color}
                          variant="subtle"
                          fontSize="2xs"
                          px={1.5}
                          borderRadius="sm"
                        >
                          {details.tag}
                        </Badge>
                        {recommended === format && !notEnoughTeams && (
                          <Badge
                            colorPalette="green"
                            variant="solid"
                            fontSize="2xs"
                            px={1.5}
                            borderRadius="sm"
                          >
                            Recommended
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="fg.muted" lineHeight="1.3">
                        {notEnoughTeams
                          ? `Needs at least ${details.minTeams} teams`
                          : details.description}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Radio indicator */}
                  <Box
                    flexShrink={0}
                    boxSize={5}
                    borderRadius="full"
                    borderWidth={2}
                    borderColor={isSelected ? solidBorder : "border.emphasized"}
                    bg={isSelected ? solidBorder : "transparent"}
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.15s ease"
                  >
                    {isSelected && <LuCheck size={12} strokeWidth={3} />}
                  </Box>
                </HStack>

                {/* Stages */}
                {details.stages && (
                  <>
                    <Box borderTopWidth={1} borderColor="border.subtle" />
                    <VStack align="stretch" gap={2}>
                      {details.stages.map((stage, index) => (
                        <HStack key={index} align="flex-start" gap={2.5}>
                          <Box
                            flexShrink={0}
                            mt="1px"
                            boxSize={5}
                            borderRadius="full"
                            bg={chipBg}
                            color={numColor}
                            fontSize="2xs"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {index + 1}
                          </Box>
                          <Text fontSize="sm" color="fg.muted" lineHeight="1.4">
                            {stage}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        );
      })}
    </VStack>
  );
}
