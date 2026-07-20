"use client";

import {
  Badge,
  Box,
  Heading,
  HStack,
  Input,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuSettings2, LuTrophy, LuUsers } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { createTournamentAction } from "@/app/tournaments/actions";
import { TournamentStore } from "@/lib/local/tournament-store";
import { initialState } from "@/contexts/tournament-context/engine";
import type {
  PlayoffConfig,
  TournamentType,
  TrophyConfig,
} from "@/contexts/tournament-context/types";
import {
  BracketPreview,
  matchCounts,
  MatchCountBanner,
  StatTile,
  SummaryCard,
  TeamChips,
} from "@/components/tournaments/tournament-summary";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import { ClubPlayerPicker } from "@/components/clubs/club-player-picker";
import { clubStore } from "@/lib/clubs/club-store";
import { TeamListEditor } from "./team-list-editor";
import { TrophyDesigner } from "./trophy-designer";
import {
  PlayoffDesigner,
  resolvePlayoffSelection,
  templatesFor,
  type PlayoffTemplate,
} from "./playoff-designer";

const STEPS = [
  "Basics",
  "Teams",
  "Settings",
  "Playoffs",
  "Trophy",
  "Review",
] as const;

const DEFAULT_TROPHY: TrophyConfig = {
  shape: "classic",
  metal: "gold",
};

const FORMATS: {
  id: TournamentType;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}[] = [
  {
    id: "round-robin",
    name: "Round Robin",
    icon: "🔄",
    description: "Everyone plays everyone, then playoffs",
    available: true,
  },
  {
    id: "single-elimination",
    name: "Single Elimination",
    icon: "⚡",
    description: "One loss and you're out",
    available: false,
  },
  {
    id: "double-elimination",
    name: "Double Elimination",
    icon: "🔥",
    description: "Two brackets, second chances",
    available: false,
  },
];

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

/** Upper bound on teams in one tournament. Shared by the step validation and
 *  the club picker so the cap has a single source of truth. */
const MAX_TEAMS = 20;

function defaultQualifiers(teamCount: number): number {
  if (teamCount >= 4) return 4;
  return Math.max(2, teamCount);
}

export function CreationWizard() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [algorithm, setAlgorithm] = useState<TournamentType>("round-robin");
  const [teams, setTeams] = useState<string[]>([]);
  const [maxOvers, setMaxOvers] = useState(20);
  const [maxWickets, setMaxWickets] = useState(10);
  const [qualifiers, setQualifiers] = useState<number>(-1); // -1 → derive
  const [template, setTemplate] = useState<PlayoffTemplate>("world-cup");
  const [customConfig, setCustomConfig] =
    useState<PlayoffConfig>(DEFAULT_CUSTOM);
  const [trophy, setTrophy] = useState<TrophyConfig>(DEFAULT_TROPHY);
  const [creating, setCreating] = useState(false);

  const teamCount = teams.length;

  const rawQualifiers =
    qualifiers < 0 ? defaultQualifiers(teamCount) : qualifiers;
  const effQualifiers =
    rawQualifiers === 0 ? 0 : Math.min(Math.max(2, rawQualifiers), teamCount);
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
        return name.trim().length > 0;
      case 1:
        return teamCount >= 2 && teamCount <= MAX_TEAMS;
      case 2:
        return maxOvers >= 1 && maxWickets >= 1;
      case 3:
        return selection.valid;
      default:
        return true;
    }
  })();

  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (!stepValid) return;
    if (isLast) return create();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      // The DB row's playoff_format is a placeholder here — the real format +
      // config live in the generated local state and are persisted on the first
      // Sync. Insert a legacy-safe value so creation also works before the
      // flexible-playoffs migration is applied.
      const { id } = await createTournamentAction({
        name: name.trim(),
        algorithm,
        playoffFormat: "world-cup",
        maxOvers,
        maxWickets,
      });
      // Generate the schedule locally into this id's store, then open matches.
      const store = new TournamentStore({
        id,
        name: name.trim(),
        status: "setup",
        state: initialState,
      });
      const res = store.generate({
        teams,
        maxOvers,
        maxWickets,
        playoffFormat: selection.format,
        playoffConfig: selection.config,
        trophy,
      });
      if (!res.success) throw new Error(res.errors?.[0] ?? "Generate failed");
      // Stamp the club players who turned out, so the picker can lead with
      // whoever plays most often. No-op when there's no club yet.
      clubStore.markPlayed(teams);
      router.push(`/tournament/round-robin/${id}/matches`);
    } catch (err) {
      console.error("Failed to create tournament:", err);
      setCreating(false);
      toaster.create({
        title: "Couldn't create tournament",
        description: err instanceof Error ? err.message : "Please try again.",
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
          <StepShell title="Tournament basics" hint="Name it and pick a format.">
            <VStack align="stretch" gap={5}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
                  Tournament name
                </Text>
                <Input
                  placeholder="e.g. Summer Cup 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && stepValid) goNext();
                  }}
                  maxLength={60}
                  size="lg"
                  autoFocus
                  bg="input.bg"
                  borderColor="input.border"
                  color="fg.default"
                  _placeholder={{ color: "fg.placeholder" }}
                  _focus={{
                    borderColor: "input.focusBorder",
                    boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
                  Format
                </Text>
                <VStack gap={2} align="stretch">
                  {FORMATS.map((f) => (
                    <FormatOption
                      key={f.id}
                      format={f}
                      selected={algorithm === f.id}
                      onSelect={() => f.available && setAlgorithm(f.id)}
                    />
                  ))}
                </VStack>
              </Box>
            </VStack>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell
            title={`Teams (${teamCount})`}
            hint="Tap who's playing, or add teams by hand. Each plays the others once."
          >
            <VStack align="stretch" gap={5}>
              <ClubPlayerPicker
                teams={teams}
                onChange={setTeams}
                max={MAX_TEAMS}
              />
              <TeamListEditor teams={teams} onChange={setTeams} />
            </VStack>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="Match settings"
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

        {step === 3 && (
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

        {step === 4 && (
          <StepShell
            title="Design the trophy"
            hint="This is what the champion wins. Make it yours."
          >
            <TrophyDesigner config={trophy} onChange={setTrophy} />
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Review" hint="Check everything, then create.">
            <ReviewSummary
              teams={teams}
              maxOvers={maxOvers}
              maxWickets={maxWickets}
              playoffLabel={selection.label}
              playoffConfig={selection.config}
              trophy={trophy}
            />
          </StepShell>
        )}
      </Box>

      <WizardFooter
        step={step}
        isLast={isLast}
        canProceed={stepValid}
        busy={creating}
        onBack={goBack}
        onNext={goNext}
      />
    </VStack>
  );
}

// ── Steps & chrome ──────────────────────────────────────────────────────────

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

function FormatOption({
  format,
  selected,
  onSelect,
}: {
  format: (typeof FORMATS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      role="radio"
      aria-checked={selected}
      aria-disabled={!format.available}
      tabIndex={format.available ? 0 : -1}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (format.available && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      p={3}
      borderWidth={selected ? 2 : 1}
      borderRadius="lg"
      colorPalette="blue"
      borderColor={selected ? "colorPalette.500" : "border.default"}
      bg={selected ? { base: "blue.50", _dark: "blue.950" } : "card.bg"}
      cursor={format.available ? "pointer" : "not-allowed"}
      opacity={format.available ? 1 : 0.6}
      transition="all 0.15s"
      _hover={
        format.available && !selected ? { borderColor: "colorPalette.300" } : {}
      }
    >
      <HStack justify="space-between" align="center">
        <HStack gap={3} align="center">
          <Text fontSize="xl" lineHeight="1">
            {format.icon}
          </Text>
          <Box>
            <Text fontWeight="medium" fontSize="sm" color="fg.default">
              {format.name}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {format.description}
            </Text>
          </Box>
        </HStack>
        {format.available ? (
          selected ? (
            <Box color="colorPalette.500" display="flex">
              <LuCheck />
            </Box>
          ) : null
        ) : (
          <Badge colorPalette="gray" variant="subtle" fontSize="xs" flexShrink={0}>
            Soon
          </Badge>
        )}
      </HStack>
    </Box>
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
  busy,
  onBack,
  onNext,
}: {
  step: number;
  isLast: boolean;
  canProceed: boolean;
  busy: boolean;
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
            disabled={busy}
          >
            Back
          </Button>
        )}
        <Button onClick={onNext} disabled={!canProceed} loading={busy} flex="1">
          {isLast ? "🚀 Create Tournament" : "Next"}
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
  trophy,
}: {
  teams: string[];
  maxOvers: number;
  maxWickets: number;
  playoffLabel: string;
  playoffConfig: PlayoffConfig | null;
  trophy: TrophyConfig;
}) {
  const structureName = playoffLabel.replace(/\s*\(top \d+\)/i, "");
  const counts = matchCounts(teams.length, playoffConfig);

  return (
    <VStack align="stretch" gap={3}>
      <MatchCountBanner
        total={counts.total}
        group={counts.group}
        playoffs={counts.playoffs}
      />

      <SummaryCard
        icon={<LuUsers size={16} />}
        title="Teams"
        badge={`${teams.length}`}
      >
        <TeamChips teams={teams} />
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

      <SummaryCard icon={<LuTrophy size={16} />} title="Trophy">
        <TrophyBadge config={trophy} size="md" />
      </SummaryCard>
    </VStack>
  );
}
