"use client";

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
} from "@chakra-ui/react";
import {
  useTournament,
  type PlayoffFormat,
} from "@/contexts/tournament-context";

interface PlayoffFormatSelectorProps {
  disabled?: boolean;
}

export function PlayoffFormatSelector({
  disabled = false,
}: PlayoffFormatSelectorProps) {
  const tournament = useTournament();

  const handleFormatChange = (format: PlayoffFormat) => {
    tournament.setPlayoffFormat(format);
  };

  const formatDetails = {
    "world-cup": {
      name: "World Cup Style",
      description: "Simple knockout format",
      icon: "🏆",
      color: "blue",
      stages: [
        "Semi-Final 1: 1st vs 4th",
        "Semi-Final 2: 2nd vs 3rd",
        "Final: Winner SF1 vs Winner SF2 (Winner → Champion)",
      ],
    },
    league: {
      name: "League Style (IPL/BBL/PSL)",
      description: "Top teams get second chances",
      icon: "🔥",
      color: "purple",
      stages: [
        "Qualifier 1: 1st vs 2nd (Winner → Final)",
        "Eliminator: 3rd vs 4th (Loser eliminated)",
        "Qualifier 2: Loser Q1 vs Winner Eliminator",
        "Final: Winner Q1 vs Winner Q2 (Winner → Champion)",
      ],
    },
  } as const;

  return (
    <VStack align="stretch" gap={4}>
      <VStack gap={3} align="stretch">
        {(Object.keys(formatDetails) as PlayoffFormat[]).map((format) => {
          const details = formatDetails[format];
          const isSelected = tournament.state.playoffFormat === format;

          return (
            <Card.Root
              key={format}
              w="full"
              borderWidth={2}
              borderColor={isSelected ? `${details.color}.400` : "gray.200"}
              bg={isSelected ? `${details.color}.50` : "white"}
              cursor={disabled ? "not-allowed" : "pointer"}
              opacity={disabled ? 0.6 : 1}
              onClick={() => !disabled && handleFormatChange(format)}
              _hover={!disabled ? { borderColor: `${details.color}.300` } : {}}
            >
              <Card.Body p={4}>
                <VStack align="stretch" gap={3}>
                  {/* Header */}
                  <HStack justify="space-between" align="center">
                    <HStack gap={2}>
                      <Text fontSize="xl">{details.icon}</Text>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold" fontSize="sm">
                          {details.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {details.description}
                        </Text>
                      </VStack>
                    </HStack>
                    {isSelected && (
                      <Badge colorScheme={details.color} variant="solid">
                        Selected
                      </Badge>
                    )}
                  </HStack>

                  {/* Stages */}
                  <VStack align="start" gap={1}>
                    {details.stages.map((stage, index) => (
                      <Text key={index} fontSize="xs" color="gray.600">
                        {index + 1}. {stage}
                      </Text>
                    ))}
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          );
        })}
      </VStack>

      {/* Current Selection Info */}
      <Box p={3} bg="blue.50" borderRadius="md">
        <Text fontSize="sm" color="blue.700">
          <strong>Selected:</strong>{" "}
          {formatDetails[tournament.state.playoffFormat].name} -{" "}
          {formatDetails[tournament.state.playoffFormat].description}
        </Text>
      </Box>
    </VStack>
  );
}
