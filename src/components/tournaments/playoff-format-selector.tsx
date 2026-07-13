"use client";

import { Box, Text, VStack, HStack, Badge, Card } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import type { PlayoffFormat } from "@/contexts/tournament-context/types";
import WorldCupTrophyIcon from "../icons/world-cup-trophy-icon";
import LeagueTrophyIcon from "../icons/league-trophy-icon";

interface PlayoffFormatSelectorProps {
  value: PlayoffFormat;
  onChange: (format: PlayoffFormat) => void;
  disabled?: boolean;
}

export function PlayoffFormatSelector({
  value,
  onChange,
  disabled = false,
}: PlayoffFormatSelectorProps) {
  const formatDetails = {
    "world-cup": {
      name: "World Cup Style",
      tag: "ICC · T20 WC",
      description: "Simple knockout — no second chances",
      icon: <WorldCupTrophyIcon width={22} height={22} />,
      color: "blue",
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
      stages: [
        "Qualifier 1: 1st vs 2nd (Winner → Final)",
        "Eliminator: 3rd vs 4th (Loser out)",
        "Qualifier 2: Loser Q1 vs Winner Eliminator",
        "Final: Winner Q1 vs Winner Q2 (→ Champion)",
      ],
    },
  } as const;

  return (
    <VStack align="stretch" gap={3} role="radiogroup" aria-label="Playoff format">
      {(Object.keys(formatDetails) as PlayoffFormat[]).map((format) => {
        const details = formatDetails[format];
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
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : 0}
            w="full"
            borderWidth={2}
            borderRadius="xl"
            borderColor={isSelected ? solidBorder : "border.default"}
            bg={isSelected ? tintBg : "card.bg"}
            cursor={disabled ? "not-allowed" : "pointer"}
            opacity={disabled ? 0.6 : 1}
            transition="border-color 0.15s ease, background 0.15s ease"
            onClick={() => !disabled && onChange(format)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(format);
              }
            }}
            _hover={
              !disabled && !isSelected
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
                      </HStack>
                      <Text fontSize="sm" color="fg.muted" lineHeight="1.3">
                        {details.description}
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

                {/* Divider */}
                <Box borderTopWidth={1} borderColor="border.subtle" />

                {/* Stages */}
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
              </VStack>
            </Card.Body>
          </Card.Root>
        );
      })}
    </VStack>
  );
}
