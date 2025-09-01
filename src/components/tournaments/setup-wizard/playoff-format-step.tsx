"use client";

import React from "react";
import { VStack, Text } from "@chakra-ui/react";
import { StepContainer } from "@/components/ui/stepper";
import { PlayoffFormatSelector } from "@/components/tournaments/playoff-format-selector";
import { useTournament } from "@/contexts/tournament-context";

interface PlayoffFormatStepProps {
  onValidationChange: (isValid: boolean) => void;
}

export function PlayoffFormatStep({
  onValidationChange,
}: PlayoffFormatStepProps) {
  const tournament = useTournament();
  const isLocked = tournament.state.matches.some((m) => m.isPlayoff);

  React.useEffect(() => {
    // Playoff format is always valid as it has a default
    onValidationChange(true);
  }, [onValidationChange]);

  return (
    <StepContainer
      title="Playoff Format"
      description="Choose how the top teams will compete in the playoffs"
    >
      <VStack align="stretch" gap={6}>
        {/* Lock Notice */}
        {isLocked && (
          <Text
            fontSize="sm"
            color="orange.600"
            textAlign="center"
            p={3}
            bg="orange.50"
            borderRadius="md"
          >
            🔒 Playoff format is locked after tournament generation
          </Text>
        )}

        {/* Playoff Format Selector */}
        <PlayoffFormatSelector disabled={isLocked} />

        {/* Additional Info */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            About Playoff Formats
          </Text>
          <VStack align="start" gap={1} fontSize="sm" color="gray.600">
            <Text>
              • <strong>World Cup Style:</strong> Simple knockout format where
              teams get one chance
            </Text>
            <Text>
              • <strong>League Style:</strong> Top teams get second chances with
              qualifiers and eliminators
            </Text>
            <Text>
              • Playoffs will be automatically generated based on round-robin
              standings
            </Text>
          </VStack>
        </VStack>
      </VStack>
    </StepContainer>
  );
}
