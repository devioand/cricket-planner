"use client";

import React from "react";
import { HStack, VStack } from "@chakra-ui/react";
import { Button } from "./button";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  finishLabel?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  showPrevious?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  nextLabel = "Next",
  previousLabel = "Previous",
  finishLabel = "Finish",
  isNextDisabled = false,
  isLoading = false,
  showPrevious = true,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <VStack gap={4} w="full">
      <HStack justify="space-between" w="full" gap={4}>
        {/* Previous Button */}
        {showPrevious ? (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep || isLoading}
            flex="1"
            maxW="200px"
          >
            ← {previousLabel}
          </Button>
        ) : (
          <div /> // Placeholder for spacing
        )}

        {/* Next/Finish Button */}
        <Button
          onClick={isLastStep ? onFinish : onNext}
          disabled={isNextDisabled || isLoading}
          loading={isLoading}
          colorPalette={isLastStep ? "green" : "blue"}
          flex="1"
          maxW="200px"
        >
          {isLastStep ? `🚀 ${finishLabel}` : `${nextLabel} →`}
        </Button>
      </HStack>
    </VStack>
  );
}
