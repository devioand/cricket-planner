"use client";

import React, { useState, useCallback } from "react";
import { VStack, Box } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { Stepper, type Step } from "@/components/ui/stepper";
import { WizardNavigation } from "@/components/ui/wizard-navigation";
import {
  TournamentInfoStep,
  type TournamentInfoData,
} from "./tournament-info-step";
import { TeamsStep } from "./teams-step";
import { MatchRulesStep } from "./match-rules-step";
import { PlayoffFormatStep } from "./playoff-format-step";
import { ReviewStep } from "./review-step";
import { useTournament } from "@/contexts/tournament-context";

const STEPS: Step[] = [
  {
    id: "info",
    title: "Tournament Info",
    description: "Basic details",
  },
  {
    id: "teams",
    title: "Teams",
    description: "Add participants",
  },
  {
    id: "rules",
    title: "Match Rules",
    description: "Overs & wickets",
  },
  {
    id: "playoffs",
    title: "Playoff Format",
    description: "Choose style",
  },
  {
    id: "review",
    title: "Review & Start",
    description: "Final check",
  },
];

export function TournamentSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>(
    {
      0: true, // Tournament info is always valid (optional fields)
      1: false, // Teams step requires validation
      2: true, // Match rules are always valid (have defaults)
      3: true, // Playoff format is always valid (has default)
      4: false, // Review step requires teams validation
    }
  );
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfoData>({
    name: "",
    description: "",
    format: "round-robin",
  });
  const [isStarting, setIsStarting] = useState(false);

  const tournament = useTournament();
  const router = useRouter();

  const handleStepValidationChange = useCallback(
    (step: number, isValid: boolean) => {
      setStepValidation((prev) => ({ ...prev, [step]: isValid }));
    },
    []
  );

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Mark current step as completed if valid
      if (stepValidation[currentStep]) {
        setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsStarting(true);
    try {
      const result = tournament.generateMatches();
      if (result.success) {
        // Navigate to matches page
        router.push("/tournament/round-robin/matches");
      } else {
        console.error("Failed to generate matches:", result.errors);
        // Handle error - could show a toast notification
      }
    } catch (error) {
      console.error("Error starting tournament:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <TournamentInfoStep
            onDataChange={setTournamentInfo}
            initialData={tournamentInfo}
          />
        );
      case 1:
        return (
          <TeamsStep
            onValidationChange={(isValid) =>
              handleStepValidationChange(1, isValid)
            }
          />
        );
      case 2:
        return (
          <MatchRulesStep
            onValidationChange={(isValid) =>
              handleStepValidationChange(2, isValid)
            }
          />
        );
      case 3:
        return (
          <PlayoffFormatStep
            onValidationChange={(isValid) =>
              handleStepValidationChange(3, isValid)
            }
          />
        );
      case 4:
        return (
          <ReviewStep
            tournamentInfo={tournamentInfo}
            onValidationChange={(isValid) =>
              handleStepValidationChange(4, isValid)
            }
          />
        );
      default:
        return null;
    }
  };

  const isCurrentStepValid = stepValidation[currentStep] ?? false;

  return (
    <VStack align="stretch" gap={8} w="full" maxW="6xl" mx="auto" p={6}>
      {/* Progress Stepper */}
      <Box w="full" overflowX="auto">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </Box>

      {/* Step Content */}
      <Box minH="500px" w="full">
        {renderCurrentStep()}
      </Box>

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={STEPS.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onFinish={handleFinish}
        isNextDisabled={!isCurrentStepValid}
        isLoading={isStarting}
        finishLabel="Start Tournament"
      />
    </VStack>
  );
}
