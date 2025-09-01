"use client";

import React from "react";
import { Box, HStack, VStack, Text, Circle, Separator } from "@chakra-ui/react";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

export function Stepper({
  steps,
  currentStep,
  completedSteps = [],
}: StepperProps) {
  return (
    <HStack gap={0} align="center" w="full" overflowX="auto" py={4}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(index);
        const isPast = index < currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle and Content */}
            <VStack gap={2} minW="120px" align="center">
              <Circle
                size="10"
                bg={
                  isCompleted || isPast
                    ? "green.500"
                    : isActive
                    ? "blue.500"
                    : "gray.200"
                }
                color={isCompleted || isPast || isActive ? "white" : "gray.500"}
                fontWeight="bold"
                fontSize="sm"
                border={isActive ? "3px solid" : "none"}
                borderColor={isActive ? "blue.200" : "transparent"}
              >
                {isCompleted || isPast ? "✓" : index + 1}
              </Circle>

              <VStack gap={0} align="center">
                <Text
                  fontSize="sm"
                  fontWeight={isActive ? "semibold" : "medium"}
                  color={
                    isActive
                      ? "blue.600"
                      : isPast || isCompleted
                      ? "green.600"
                      : "gray.600"
                  }
                  textAlign="center"
                  lineHeight="tight"
                >
                  {step.title}
                </Text>
                {step.description && (
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    lineHeight="tight"
                  >
                    {step.description}
                  </Text>
                )}
              </VStack>
            </VStack>

            {/* Separator Line */}
            {index < steps.length - 1 && (
              <Box flex="1" px={2}>
                <Separator
                  orientation="horizontal"
                  borderColor={isPast || isCompleted ? "green.300" : "gray.300"}
                  borderWidth="2px"
                />
              </Box>
            )}
          </React.Fragment>
        );
      })}
    </HStack>
  );
}

interface StepContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function StepContainer({
  children,
  title,
  description,
}: StepContainerProps) {
  return (
    <VStack align="stretch" gap={6} w="full" maxW="2xl" mx="auto">
      <VStack align="stretch" gap={2}>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          {title}
        </Text>
        {description && (
          <Text fontSize="md" color="gray.600">
            {description}
          </Text>
        )}
      </VStack>

      <Box>{children}</Box>
    </VStack>
  );
}
