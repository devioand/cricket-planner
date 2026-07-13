"use client";

import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuUsers, LuSettings2, LuTrophy } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import type {
  PlayoffConfig,
  PlayoffSlot,
} from "@/contexts/tournament-context/types";
import { TeamListEditor } from "./team-list-editor";
import {
  PlayoffDesigner,
  resolvePlayoffSelection,
  templatesFor,
  type PlayoffTemplate,
} from "./playoff-designer";

const STEPS = ["Teams", "Settings", "Playoffs", "Review"] as const;

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

/** Preferred qualifier count for a team count (before the user changes it). */
function defaultQualifiers(teamCount: number): number {
  if (teamCount >= 4) return 4;
  return Math.max(2, teamCount);
}

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
  // Qualifiers-first playoff selection: 0 = no playoffs.
  const [qualifiers, setQualifiers] = useState<number>(-1); // -1 → derive from team count
  const [template, setTemplate] = useState<PlayoffTemplate>("world-cup");
  const [customConfig, setCustomConfig] =
    useState<PlayoffConfig>(DEFAULT_CUSTOM);
  const [starting, setStarting] = useState(false);

  const teamCount = teams.length;

  // Effective qualifiers: default until the user picks, then clamped to the
  // current team count (0 stays 0 = no playoffs).
  const rawQualifiers = qualifiers < 0 ? defaultQualifiers(teamCount) : qualifiers;
  const effQualifiers =
    rawQualifiers === 0 ? 0 : Math.min(Math.max(2, rawQualifiers), teamCount);

  // Effective template: keep the user's choice if it still fits the count,
  // otherwise fall back to the first sensible one.
  const availableTemplates = templatesFor(effQualifiers);
  const effTemplate: PlayoffTemplate = availableTemplates.includes(template)
    ? template
    : availableTemplates[0] ?? "final";

  const selection = resolvePlayoffSelection(
    effQualifiers,
    effTemplate,
    customConfig,
    teamCount,
  );

  const stepValid = (() => {
    switch (step) {
      case 0:
        return teamCount >= 2 && teamCount <= 20;
      case 1:
        return maxOvers >= 1 && maxWickets >= 1;
      case 2:
        return selection.valid;
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
      playoffFormat: selection.format,
      playoffConfig: selection.config,
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
            hint="Pick how many teams qualify, then the structure."
          >
            <PlayoffDesigner
              teamCount={teamCount}
              qualifiers={effQualifiers}
              template={effTemplate}
              customConfig={customConfig}
              onQualifiersChange={setQualifiers}
              onTemplateChange={setTemplate}
              onCustomConfigChange={setCustomConfig}
            />
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Review" hint="Check everything, then start.">
            <ReviewSummary
              teams={teams}
              maxOvers={maxOvers}
              maxWickets={maxWickets}
              playoffLabel={selection.label}
              playoffConfig={selection.config}
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
  playoffLabel,
  playoffConfig,
}: {
  teams: string[];
  maxOvers: number;
  maxWickets: number;
  playoffLabel: string;
  playoffConfig: PlayoffConfig | null;
}) {
  // The card badge carries the qualifier count, so drop the "(top N)" suffix.
  const structureName = playoffLabel.replace(/\s*\(top \d+\)/i, "");

  // Match counts. With exactly 2 teams there's no group stage — a single final.
  const n = teams.length;
  const groupMatches = n >= 3 ? (n * (n - 1)) / 2 : 0;
  const playoffMatches =
    n === 2 ? 1 : playoffConfig ? playoffConfig.matches.length : 0;
  const totalMatches = groupMatches + playoffMatches;

  return (
    <VStack align="stretch" gap={3}>
      <MatchCountBanner
        total={totalMatches}
        group={groupMatches}
        playoffs={playoffMatches}
      />

      <SummaryCard
        icon={<LuUsers size={16} />}
        title="Teams"
        badge={`${teams.length}`}
      >
        <HStack gap={2} flexWrap="wrap">
          {teams.map((t) => (
            <Badge
              key={t}
              colorPalette="blue"
              variant="subtle"
              px={2.5}
              py={1}
              borderRadius="full"
              fontSize="sm"
            >
              {t}
            </Badge>
          ))}
        </HStack>
      </SummaryCard>

      <SummaryCard icon={<LuSettings2 size={16} />} title="Match format">
        <VStack align="stretch" gap={3}>
          <HStack gap={2} align="baseline">
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              Round Robin
            </Text>
            <Text fontSize="xs" color="fg.muted">
              every team plays once
            </Text>
          </HStack>
          <HStack gap={2.5} align="stretch">
            <StatTile label="Overs" value={maxOvers} />
            <StatTile label="Wickets" value={maxWickets} />
          </HStack>
        </VStack>
      </SummaryCard>

      <SummaryCard
        icon={<LuTrophy size={16} />}
        title="Playoffs"
        badge={playoffConfig ? `Top ${playoffConfig.qualifiers}` : "None"}
      >
        {playoffConfig ? (
          <VStack align="stretch" gap={3}>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              {structureName}
            </Text>
            <BracketPreview config={playoffConfig} />
          </VStack>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            No knockout — the team that tops the standings is the champion.
          </Text>
        )}
      </SummaryCard>
    </VStack>
  );
}

function MatchCountBanner({
  total,
  group,
  playoffs,
}: {
  total: number;
  group: number;
  playoffs: number;
}) {
  return (
    <Card.Root
      borderWidth={1}
      borderColor={{ base: "blue.200", _dark: "blue.800" }}
      bg={{ base: "blue.50", _dark: "blue.950" }}
    >
      <Card.Body p={4}>
        <HStack justify="space-between" align="center" gap={3}>
          <HStack gap={3} align="center">
            <Text fontSize="3xl" fontWeight="bold" color="fg.default" lineHeight="1">
              {total}
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              {total === 1 ? "match" : "matches"}
              <br />
              to play
            </Text>
          </HStack>
          <VStack align="stretch" gap={1.5}>
            <HStack gap={2} justify="flex-end">
              <Text fontSize="xs" color="fg.muted">
                Group stage
              </Text>
              <Badge colorPalette="gray" variant="subtle" borderRadius="md">
                {group}
              </Badge>
            </HStack>
            <HStack gap={2} justify="flex-end">
              <Text fontSize="xs" color="fg.muted">
                Playoffs
              </Text>
              <Badge colorPalette="yellow" variant="subtle" borderRadius="md">
                {playoffs}
              </Badge>
            </HStack>
          </VStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function SummaryCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <Card.Root borderWidth={1} borderColor="card.border" bg="card.bg">
      <Card.Body p={4}>
        <HStack justify="space-between" align="center" mb={3}>
          <HStack gap={2} color="fg.muted">
            {icon}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {title}
            </Text>
          </HStack>
          {badge && (
            <Badge colorPalette="gray" variant="subtle" borderRadius="md">
              {badge}
            </Badge>
          )}
        </HStack>
        {children}
      </Card.Body>
    </Card.Root>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Box flex="1" bg="bg.subtle" borderRadius="lg" px={3} py={2.5} textAlign="center">
      <Text fontSize="md" fontWeight="bold" color="fg.default" lineHeight="1.2">
        {value}
      </Text>
      <Text
        fontSize="2xs"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mt={0.5}
      >
        {label}
      </Text>
    </Box>
  );
}

/** A compact list of playoff matches with each side described in plain words. */
function BracketPreview({ config }: { config: PlayoffConfig }) {
  const labelById: Record<string, string> = {};
  for (const m of config.matches) labelById[m.id] = m.label;

  return (
    <VStack align="stretch" gap={2}>
      {config.matches.map((m) => (
        <HStack
          key={m.id}
          gap={3}
          align="center"
          bg={m.isFinal ? { base: "yellow.50", _dark: "yellow.950" } : "bg.subtle"}
          borderRadius="lg"
          px={3}
          py={2}
        >
          <Box fontSize="md" flexShrink={0}>
            {m.isFinal ? "🏆" : "⚔️"}
          </Box>
          <Box flex="1" minW={0}>
            <Text fontSize="sm" fontWeight="medium" color="fg.default">
              {m.label}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {slotText(m.slot1, labelById)} vs {slotText(m.slot2, labelById)}
            </Text>
          </Box>
        </HStack>
      ))}
    </VStack>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function slotText(slot: PlayoffSlot, labelById: Record<string, string>): string {
  if (slot.kind === "seed") return ordinal(slot.seed);
  const ref = labelById[slot.matchId] ?? slot.matchId;
  return `${slot.kind === "winnerOf" ? "Winner" : "Loser"} of ${ref}`;
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
