"use client";

import {
  Box,
  Heading,
  HStack,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import type {
  PlayoffConfig,
  PlayoffFormat,
} from "@/contexts/tournament-context/types";
import { validatePlayoffConfig } from "@/contexts/tournament-context/algorithms/playoff-config-validation";
import {
  PlayoffFormatSelector,
  recommendedPlayoffFormat,
} from "@/components/tournaments/playoff-format-selector";
import { TeamListEditor } from "./team-list-editor";
import { CustomPlayoffBuilder } from "./custom-playoff-builder";

const STEPS = ["Teams", "Settings", "Playoffs", "Review"] as const;

/** Minimum teams each format needs (mirrors the selector's gating). */
const FORMAT_MIN_TEAMS: Record<PlayoffFormat, number> = {
  none: 2,
  "final-only": 2,
  "world-cup": 4,
  league: 4,
  custom: 3,
};

const DEFAULT_CUSTOM: PlayoffConfig = {
  qualifiers: 2,
  matches: [
    {
      id: "PO-001",
      label: "Final",
      round: 1,
      slot1: { kind: "seed", seed: 1 },
      slot2: { kind: "seed", seed: 2 },
      isFinal: true,
    },
  ],
};

const FORMAT_LABEL: Record<PlayoffFormat, string> = {
  none: "No playoffs — table topper wins",
  "final-only": "Final only (top 2)",
  "world-cup": "World Cup — Semis + Final",
  league: "League/IPL — Q1, Eliminator, Q2, Final",
  custom: "Custom bracket",
};

export function SetupWizard() {
  const { state, store } = useLiveTournament();

  // Already generated → this route is a locked summary, not the wizard.
  if (state.isGenerated) {
    return <GeneratedSummary storeId={store.id} state={state} />;
  }

  return <Wizard />;
}

function Wizard() {
  const router = useRouter();
  const { state, store } = useLiveTournament();

  const [step, setStep] = useState(0);
  const [teams, setTeams] = useState<string[]>(state.teams);
  const [maxOvers, setMaxOvers] = useState(state.maxOvers);
  const [maxWickets, setMaxWickets] = useState(state.maxWickets);
  const [playoffFormat, setPlayoffFormat] = useState<PlayoffFormat>(
    state.playoffFormat,
  );
  const [customConfig, setCustomConfig] =
    useState<PlayoffConfig>(DEFAULT_CUSTOM);
  const [starting, setStarting] = useState(false);

  const teamCount = teams.length;
  const recommended = recommendedPlayoffFormat(teamCount);

  // If the chosen format no longer fits the team count (e.g. teams were
  // removed), fall back to the recommended one when we reach the playoff step.
  const effectiveFormat: PlayoffFormat =
    teamCount >= FORMAT_MIN_TEAMS[playoffFormat] ? playoffFormat : recommended;

  const customValidation = useMemo(
    () => validatePlayoffConfig(customConfig, teamCount),
    [customConfig, teamCount],
  );

  const stepValid = (() => {
    switch (step) {
      case 0:
        return teamCount >= 2 && teamCount <= 20;
      case 1:
        return maxOvers >= 1 && maxWickets >= 1;
      case 2:
        return effectiveFormat === "custom" ? customValidation.valid : true;
      default:
        return true;
    }
  })();

  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (!stepValid) return;
    if (isLast) return start();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const start = () => {
    if (starting) return;
    setStarting(true);
    const result = store.generate({
      teams,
      maxOvers,
      maxWickets,
      playoffFormat: effectiveFormat,
      playoffConfig: effectiveFormat === "custom" ? customConfig : null,
    });
    if (result.success) {
      router.push(`/tournament/round-robin/${store.id}/matches`);
    } else {
      setStarting(false);
      toaster.create({
        title: "Couldn't start tournament",
        description: result.errors?.[0] ?? "Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  };

  return (
    <VStack align="stretch" gap={6} pb="88px">
      <WizardProgress step={step} />

      <Box>
        {step === 0 && (
          <StepShell
            title={`Teams (${teamCount})`}
            hint="Add every team. Each plays the others once."
          >
            <TeamListEditor teams={teams} onChange={setTeams} />
          </StepShell>
        )}

        {step === 1 && (
          <StepShell
            title="Match Settings"
            hint="Overs and wickets apply to every match."
          >
            <VStack align="stretch" gap={5}>
              <NumberField
                label="Max Overs"
                helper="T20 = 20, ODI = 50"
                value={maxOvers}
                min={1}
                max={50}
                onChange={setMaxOvers}
              />
              <NumberField
                label="Max Wickets"
                helper="Standard: 10 wickets"
                value={maxWickets}
                min={1}
                max={11}
                onChange={setMaxWickets}
              />
            </VStack>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="Playoffs"
            hint="How the top teams decide the champion."
          >
            <VStack align="stretch" gap={5}>
              <PlayoffFormatSelector
                value={effectiveFormat}
                onChange={setPlayoffFormat}
                teamCount={teamCount}
                recommended={recommended}
              />
              {effectiveFormat === "custom" && (
                <Box>
                  <Heading size="sm" mb={1}>
                    Build your bracket
                  </Heading>
                  <Text fontSize="sm" color="fg.muted" mb={3}>
                    Add matches and fill each side from a seed or another
                    match&apos;s result. Mark exactly one match as the final.
                  </Text>
                  <CustomPlayoffBuilder
                    teamCount={teamCount}
                    value={customConfig}
                    onChange={setCustomConfig}
                  />
                </Box>
              )}
            </VStack>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Review" hint="Check everything, then start.">
            <ReviewSummary
              teams={teams}
              maxOvers={maxOvers}
              maxWickets={maxWickets}
              format={effectiveFormat}
              customConfig={effectiveFormat === "custom" ? customConfig : null}
            />
          </StepShell>
        )}
      </Box>

      <WizardFooter
        step={step}
        isLast={isLast}
        canProceed={stepValid}
        starting={starting}
        onBack={goBack}
        onNext={goNext}
      />
    </VStack>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WizardProgress({ step }: { step: number }) {
  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="medium" color="fg.default">
          {STEPS[step]}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Step {step + 1} of {STEPS.length}
        </Text>
      </HStack>
      <HStack gap={1.5}>
        {STEPS.map((s, i) => (
          <Box
            key={s}
            flex="1"
            h="4px"
            borderRadius="full"
            bg={i <= step ? "blue.500" : "bg.emphasized"}
            transition="background 0.2s"
          />
        ))}
      </HStack>
    </VStack>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <VStack align="stretch" gap={4}>
      <VStack align="stretch" gap={1}>
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="fg.muted">
          {hint}
        </Text>
      </VStack>
      {children}
    </VStack>
  );
}

function NumberField({
  label,
  helper,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
        {label}
      </Text>
      <NumberInput.Root
        value={value.toString()}
        min={min}
        max={max}
        onValueChange={(d) => {
          const v = parseInt(d.value);
          if (!isNaN(v)) onChange(v);
        }}
        size="lg"
      >
        <NumberInput.Control />
        <NumberInput.Input
          bg="input.bg"
          borderColor="input.border"
          color="fg.default"
          _focus={{
            borderColor: "input.focusBorder",
            boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
          }}
        />
      </NumberInput.Root>
      <Text fontSize="xs" color="fg.muted" mt={1}>
        {helper}
      </Text>
    </Box>
  );
}

function WizardFooter({
  step,
  isLast,
  canProceed,
  starting,
  onBack,
  onNext,
}: {
  step: number;
  isLast: boolean;
  canProceed: boolean;
  starting: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg.panel"
      borderTopWidth={1}
      borderColor="border.default"
      px={4}
      py={3}
      zIndex={10}
    >
      <HStack gap={3} maxW="600px" mx="auto">
        {step > 0 && (
          <Button
            variant="outline"
            colorPalette="gray"
            onClick={onBack}
            flex="0 0 auto"
            minW="96px"
            disabled={starting}
          >
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!canProceed}
          loading={starting}
          flex="1"
        >
          {isLast ? "🚀 Start Tournament" : "Next"}
        </Button>
      </HStack>
    </Box>
  );
}

function ReviewSummary({
  teams,
  maxOvers,
  maxWickets,
  format,
  customConfig,
}: {
  teams: string[];
  maxOvers: number;
  maxWickets: number;
  format: PlayoffFormat;
  customConfig: PlayoffConfig | null;
}) {
  return (
    <VStack align="stretch" gap={4}>
      <SummaryRow label="Teams">
        <Text fontSize="sm" color="fg.default">
          {teams.join(", ")}
        </Text>
      </SummaryRow>
      <SummaryRow label="Format">
        <Text fontSize="sm" color="fg.default">
          Round Robin · {maxOvers} overs · {maxWickets} wickets
        </Text>
      </SummaryRow>
      <SummaryRow label="Playoffs">
        <Text fontSize="sm" color="fg.default">
          {FORMAT_LABEL[format]}
        </Text>
        {customConfig && (
          <VStack align="stretch" gap={0.5} mt={1}>
            {customConfig.matches.map((m) => (
              <Text key={m.id} fontSize="xs" color="fg.muted">
                • {m.label}
                {m.isFinal ? " (final)" : ""}
              </Text>
            ))}
          </VStack>
        )}
      </SummaryRow>
    </VStack>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={0.5}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function GeneratedSummary({
  storeId,
  state,
}: {
  storeId: string;
  state: { teams: string[]; maxOvers: number; maxWickets: number };
}) {
  const router = useRouter();
  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={1}>
        <Heading size="md">Tournament ready</Heading>
        <Text fontSize="sm" color="fg.muted">
          Setup is locked once matches are generated.
        </Text>
      </VStack>
      <ReviewSummaryLocked state={state} />
      <Button
        onClick={() => router.push(`/tournament/round-robin/${storeId}/matches`)}
        colorPalette="blue"
        w="full"
      >
        Go to Matches →
      </Button>
    </VStack>
  );
}

function ReviewSummaryLocked({
  state,
}: {
  state: { teams: string[]; maxOvers: number; maxWickets: number };
}) {
  return (
    <VStack align="stretch" gap={4}>
      <SummaryRow label={`Teams (${state.teams.length})`}>
        <Text fontSize="sm" color="fg.default">
          {state.teams.join(", ")}
        </Text>
      </SummaryRow>
      <SummaryRow label="Match settings">
        <Text fontSize="sm" color="fg.default">
          {state.maxOvers} overs · {state.maxWickets} wickets
        </Text>
      </SummaryRow>
    </VStack>
  );
}
