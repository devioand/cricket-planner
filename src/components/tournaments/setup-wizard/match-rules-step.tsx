"use client";

import React from "react";
import {
  VStack,
  HStack,
  Text,
  NumberInput,
  Card,
  Badge,
  Grid,
  Box,
} from "@chakra-ui/react";
import { StepContainer } from "@/components/ui/stepper";
import { useTournament } from "@/contexts/tournament-context";

interface MatchRulesStepProps {
  onValidationChange: (isValid: boolean) => void;
}

export function MatchRulesStep({ onValidationChange }: MatchRulesStepProps) {
  const tournament = useTournament();
  const isLocked = tournament.state.isGenerated;

  React.useEffect(() => {
    // Match rules are always valid as they have defaults
    onValidationChange(true);
  }, [onValidationChange]);

  const formatPresets = [
    {
      name: "T20",
      description: "Twenty20 format",
      overs: 20,
      wickets: 10,
      icon: "⚡",
      popular: true,
    },
    {
      name: "T10",
      description: "Super quick format",
      overs: 10,
      wickets: 10,
      icon: "🚀",
      popular: false,
    },
    {
      name: "ODI",
      description: "One Day International",
      overs: 50,
      wickets: 10,
      icon: "🏏",
      popular: false,
    },
    {
      name: "Test",
      description: "Traditional long format",
      overs: 90,
      wickets: 10,
      icon: "⏰",
      popular: false,
    },
  ];

  const handlePresetSelect = (preset: (typeof formatPresets)[0]) => {
    if (!isLocked) {
      tournament.setMaxOvers(preset.overs);
      tournament.setMaxWickets(preset.wickets);
    }
  };

  const currentFormat = formatPresets.find(
    (preset) =>
      preset.overs === tournament.state.maxOvers &&
      preset.wickets === tournament.state.maxWickets
  );

  return (
    <StepContainer
      title="Match Rules"
      description="Configure the rules for matches in your tournament"
    >
      <VStack align="stretch" gap={6}>
        {/* Format Presets */}
        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Quick Presets
          </Text>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
            {formatPresets.map((preset) => {
              const isSelected =
                preset.overs === tournament.state.maxOvers &&
                preset.wickets === tournament.state.maxWickets;

              return (
                <Card.Root
                  key={preset.name}
                  borderWidth={2}
                  borderColor={isSelected ? "blue.400" : "gray.200"}
                  bg={isSelected ? "blue.50" : "white"}
                  cursor={isLocked ? "not-allowed" : "pointer"}
                  opacity={isLocked ? 0.6 : 1}
                  onClick={() => handlePresetSelect(preset)}
                  _hover={
                    !isLocked
                      ? { borderColor: isSelected ? "blue.400" : "blue.300" }
                      : {}
                  }
                  transition="all 0.2s"
                >
                  <Card.Body p={4}>
                    <VStack gap={2}>
                      <HStack justify="space-between" w="full">
                        <HStack>
                          <Text fontSize="lg">{preset.icon}</Text>
                          <Text fontWeight="semibold" color="gray.800">
                            {preset.name}
                          </Text>
                        </HStack>
                        {preset.popular && (
                          <Badge
                            colorPalette="orange"
                            variant="solid"
                            size="sm"
                          >
                            Popular
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge colorPalette="blue" variant="solid" size="sm">
                            Selected
                          </Badge>
                        )}
                      </HStack>
                      <VStack align="start" w="full" gap={1}>
                        <Text fontSize="sm" color="gray.600">
                          {preset.description}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {preset.overs} overs • {preset.wickets} wickets
                        </Text>
                      </VStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              );
            })}
          </Grid>
        </VStack>

        {/* Custom Settings */}
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            Custom Settings
          </Text>

          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
            {/* Max Overs */}
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Max Overs per Innings
              </Text>
              <NumberInput.Root
                value={tournament.state.maxOvers.toString()}
                min={1}
                max={100}
                onValueChange={(details) => {
                  if (!isLocked) {
                    const value = parseInt(details.value);
                    if (!isNaN(value)) {
                      tournament.setMaxOvers(value);
                    }
                  }
                }}
                size="lg"
                disabled={isLocked}
              >
                <NumberInput.Control />
                <NumberInput.Input readOnly={isLocked} />
              </NumberInput.Root>
              <Text fontSize="xs" color="gray.500">
                Standard formats: T20 (20), ODI (50)
                {isLocked && " (Locked during tournament)"}
              </Text>
            </VStack>

            {/* Max Wickets */}
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Max Wickets per Innings
              </Text>
              <NumberInput.Root
                value={tournament.state.maxWickets.toString()}
                min={1}
                max={11}
                onValueChange={(details) => {
                  if (!isLocked) {
                    const value = parseInt(details.value);
                    if (!isNaN(value)) {
                      tournament.setMaxWickets(value);
                    }
                  }
                }}
                size="lg"
                disabled={isLocked}
              >
                <NumberInput.Control />
                <NumberInput.Input readOnly={isLocked} />
              </NumberInput.Root>
              <Text fontSize="xs" color="gray.500">
                Standard: 10 wickets
                {isLocked && " (Locked during tournament)"}
              </Text>
            </VStack>
          </Grid>
        </VStack>

        {/* Current Configuration Summary */}
        <Card.Root bg="blue.50" borderColor="blue.200" borderWidth={1}>
          <Card.Body p={4}>
            <VStack align="stretch" gap={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="semibold" color="blue.700">
                  Current Configuration
                </Text>
                {currentFormat && (
                  <Badge colorPalette="blue" variant="solid">
                    {currentFormat.name} Format
                  </Badge>
                )}
              </HStack>

              <Grid
                templateColumns="repeat(auto-fit, minmax(150px, 1fr))"
                gap={4}
              >
                <Box>
                  <Text fontSize="xs" color="blue.600" fontWeight="medium">
                    MAX OVERS
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.800">
                    {tournament.state.maxOvers}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="blue.600" fontWeight="medium">
                    MAX WICKETS
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.800">
                    {tournament.state.maxWickets}
                  </Text>
                </Box>
              </Grid>

              {currentFormat && (
                <Text fontSize="sm" color="blue.600">
                  {currentFormat.description} - Perfect for{" "}
                  {currentFormat.name === "T20"
                    ? "exciting"
                    : currentFormat.name === "T10"
                    ? "quick"
                    : "comprehensive"}{" "}
                  matches!
                </Text>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </StepContainer>
  );
}
