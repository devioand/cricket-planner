"use client";

import React from "react";
import {
  VStack,
  HStack,
  Text,
  Card,
  Badge,
  Grid,
  Box,
  Separator,
} from "@chakra-ui/react";
import { StepContainer } from "@/components/ui/stepper";
import { useTournament } from "@/contexts/tournament-context";
import type { TournamentInfoData } from "./tournament-info-step";

interface ReviewStepProps {
  tournamentInfo: TournamentInfoData;
  onValidationChange: (isValid: boolean) => void;
}

export function ReviewStep({
  tournamentInfo,
  onValidationChange,
}: ReviewStepProps) {
  const tournament = useTournament();
  const teams = tournament.state.teams;
  const isValid = teams.length >= 2;

  React.useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  const formatDetails = {
    "world-cup": {
      name: "World Cup Style",
      description: "Simple knockout format",
      icon: "🏆",
    },
    league: {
      name: "League Style (IPL/BBL/PSL)",
      description: "Top teams get second chances",
      icon: "🔥",
    },
  } as const;

  const currentFormat = formatDetails[tournament.state.playoffFormat];
  const totalMatches = (teams.length * (teams.length - 1)) / 2; // Round robin matches

  return (
    <StepContainer
      title="Review & Start Tournament"
      description="Review your tournament configuration and start when ready"
    >
      <VStack align="stretch" gap={6}>
        {/* Tournament Overview */}
        <Card.Root borderWidth={2} borderColor="blue.200" bg="blue.50">
          <Card.Body p={6}>
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between" align="center">
                <VStack align="start" gap={1}>
                  <Text fontSize="xl" fontWeight="bold" color="blue.800">
                    {tournamentInfo.name || "Cricket Tournament"}
                  </Text>
                  {tournamentInfo.description && (
                    <Text fontSize="sm" color="blue.700">
                      {tournamentInfo.description}
                    </Text>
                  )}
                </VStack>
                <Badge colorPalette="blue" variant="solid" size="lg">
                  Round Robin
                </Badge>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Configuration Summary */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
          {/* Teams */}
          <Card.Root>
            <Card.Body p={4}>
              <VStack align="start" gap={3}>
                <HStack>
                  <Text fontSize="lg">👥</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    Teams
                  </Text>
                </HStack>
                <VStack align="start" gap={1} w="full">
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    {teams.length}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {teams.length >= 2 ? "Ready to compete" : "Need more teams"}
                  </Text>
                  {teams.length > 0 && (
                    <Box mt={2}>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        Teams:
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {teams.slice(0, 3).join(", ")}
                        {teams.length > 3 && ` +${teams.length - 3} more`}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Match Rules */}
          <Card.Root>
            <Card.Body p={4}>
              <VStack align="start" gap={3}>
                <HStack>
                  <Text fontSize="lg">🏏</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    Match Rules
                  </Text>
                </HStack>
                <VStack align="start" gap={1} w="full">
                  <HStack gap={4}>
                    <VStack align="start" gap={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {tournament.state.maxOvers}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Overs
                      </Text>
                    </VStack>
                    <VStack align="start" gap={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        {tournament.state.maxWickets}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Wickets
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {tournament.state.maxOvers === 20
                      ? "T20 Format"
                      : tournament.state.maxOvers === 50
                      ? "ODI Format"
                      : tournament.state.maxOvers === 10
                      ? "T10 Format"
                      : "Custom Format"}
                  </Text>
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Playoff Format */}
          <Card.Root>
            <Card.Body p={4}>
              <VStack align="start" gap={3}>
                <HStack>
                  <Text fontSize="lg">{currentFormat.icon}</Text>
                  <Text fontWeight="semibold" color="gray.800">
                    Playoffs
                  </Text>
                </HStack>
                <VStack align="start" gap={1} w="full">
                  <Text fontSize="sm" fontWeight="medium" color="gray.800">
                    {currentFormat.name}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {currentFormat.description}
                  </Text>
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Tournament Statistics */}
        <Card.Root bg="gray.50" borderColor="gray.200">
          <Card.Body p={4}>
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Tournament Statistics
              </Text>

              <Grid
                templateColumns="repeat(auto-fit, minmax(120px, 1fr))"
                gap={4}
              >
                <VStack align="center" gap={1}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {totalMatches}
                  </Text>
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    Round Robin Matches
                  </Text>
                </VStack>

                <VStack align="center" gap={1}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {teams.length >= 4 ? "3-4" : teams.length >= 3 ? "1" : "0"}
                  </Text>
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    Playoff Matches
                  </Text>
                </VStack>

                <VStack align="center" gap={1}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    {Math.min(4, teams.length)}
                  </Text>
                  <Text fontSize="xs" color="gray.600" textAlign="center">
                    Playoff Teams
                  </Text>
                </VStack>
              </Grid>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Validation Messages */}
        {!isValid && (
          <Card.Root borderColor="orange.200" bg="orange.50">
            <Card.Body p={4}>
              <VStack align="center" gap={2}>
                <Text fontSize="lg">⚠️</Text>
                <Text fontSize="sm" color="orange.700" textAlign="center">
                  You need at least 2 teams to start the tournament
                </Text>
                <Text fontSize="xs" color="orange.600" textAlign="center">
                  Go back to the Teams step to add more teams
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {isValid && (
          <Card.Root borderColor="green.200" bg="green.50">
            <Card.Body p={4}>
              <VStack align="center" gap={2}>
                <Text fontSize="lg">🚀</Text>
                <Text
                  fontSize="sm"
                  color="green.700"
                  textAlign="center"
                  fontWeight="medium"
                >
                  Everything looks good! Ready to start your tournament.
                </Text>
                <Text fontSize="xs" color="green.600" textAlign="center">
                  Click "Start Tournament" to generate all matches
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </StepContainer>
  );
}
