"use client";

import { Box, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { createTournamentAction } from "@/app/tournaments/actions";
import { clubStore } from "@/lib/clubs/club-store";
import { TournamentStore } from "@/lib/local/tournament-store";
import { initialState } from "@/contexts/tournament-context/engine";
import type {
  PlayoffConfig,
  TournamentType,
  TrophyConfig,
} from "@/contexts/tournament-context/types";
import { TrophyDesigner } from "./trophy-designer";
import {
  TeamBuilder,
  buildTeams,
  pruneAssignment,
  type Assignment,
} from "./team-builder";
import { PlayersStep } from "./players-step";
import { FormatStep, FORMATS, type FormatSpec } from "./format-step";
import { NumberField } from "./number-field";
import {
  resolvePlayoffSelection,
  templatesFor,
  type PlayoffTemplate,
} from "./playoff-designer";

const DEFAULT_TROPHY: TrophyConfig = { shape: "classic", metal: "gold" };

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

/** Upper bound on teams in one tournament, and a generous cap on how many
 *  people can be picked before they're split into sides. */
const MAX_TEAMS = 20;
const MAX_ATTENDEES = 30;

/** Round-robin match count for a team count. */
const rr = (t: number) => (t * (t - 1)) / 2;

function defaultQualifiers(teamCount: number): number {
  if (teamCount >= 4) return 4;
  return Math.max(2, teamCount);
}

type StepName = "Players" | "Format" | "Sides" | "Teams" | "Finish";

export function CreationWizard({
  recentNames = [],
}: {
  recentNames?: string[];
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [formatId, setFormatId] = useState<string>("round-robin");
  const [sides, setSides] = useState<1 | 2 | 3>(1);
  const [extraMode, setExtraMode] = useState<"bigger" | "sitout">("bigger");
  const [assign, setAssign] = useState<Assignment>({});
  const [name, setName] = useState("");
  const [maxOvers, setMaxOvers] = useState(20);
  const [maxWickets, setMaxWickets] = useState(10);
  const [trophy, setTrophy] = useState<TrophyConfig>(DEFAULT_TROPHY);
  // Empty = play now. A datetime-local value parks the game in Upcoming.
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const algorithm: TournamentType = format.algorithm ?? "round-robin";

  // Turn attendees + a side size into the team-name strings the engine runs on.
  const built = buildTeams(attendees, sides, extraMode, assign);
  const teams = sides === 1 ? attendees : built.teams;
  const teamCount = sides === 1 ? attendees.length : built.caps.length;
  const teamsComplete = sides === 1 ? attendees.length >= 2 : built.complete;

  // Steps are dynamic: solo skips the team-building screen entirely.
  const steps: StepName[] = [
    "Players",
    "Format",
    "Sides",
    ...(sides > 1 ? (["Teams"] as StepName[]) : []),
    "Finish",
  ];
  const stepName = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  // Playoffs default sensibly (no dedicated step) — a world-cup knockout off the
  // round-robin table, sized to the field.
  const effQualifiers = Math.min(
    Math.max(2, defaultQualifiers(teamCount)),
    teamCount,
  );
  const availableTemplates = templatesFor(effQualifiers);
  const effTemplate: PlayoffTemplate = availableTemplates.includes("world-cup")
    ? "world-cup"
    : availableTemplates[0] ?? "final";
  const selection = resolvePlayoffSelection(
    effQualifiers,
    effTemplate,
    DEFAULT_CUSTOM,
    teamCount,
  );

  const handleAttendeesChange = (next: string[]) => {
    setAttendees(next);
    setAssign((a) => pruneAssignment(a, next));
  };
  const handleSidesChange = (next: 1 | 2 | 3) => {
    setSides(next);
    setAssign({});
  };
  const handleExtraModeChange = (next: "bigger" | "sitout") => {
    setExtraMode(next);
    setAssign({});
  };
  const handleFormat = (spec: FormatSpec) => setFormatId(spec.id);

  const teamsForSize = (size: number) => Math.floor(attendees.length / size);
  const sizeEnabled = (size: number) => {
    const t = teamsForSize(size);
    return t >= 2 && t <= MAX_TEAMS;
  };

  const stepValid = (() => {
    switch (stepName) {
      case "Players":
        return attendees.length >= 2 && attendees.length <= MAX_ATTENDEES;
      case "Format":
        return format.available;
      case "Sides":
        return sizeEnabled(sides);
      case "Teams":
        return built.complete;
      case "Finish":
        return (
          name.trim().length > 0 &&
          maxOvers >= 1 &&
          maxWickets >= 1 &&
          teamCount >= 2 &&
          teamCount <= MAX_TEAMS &&
          teamsComplete &&
          (!scheduleMode || scheduledAt !== "")
        );
      default:
        return true;
    }
  })();

  const goNext = () => {
    if (!stepValid) return;
    if (isLast) return create();
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const scheduledStart =
        scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : null;
      const { id } = await createTournamentAction({
        name: name.trim(),
        algorithm,
        playoffFormat: "world-cup",
        maxOvers,
        maxWickets,
        scheduledStart,
      });
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
      // Stamp who turned out so the picker leads with regulars next time.
      clubStore.markPlayed(attendees);
      if (scheduledStart) {
        // Mirror the schedule into local state (kept on the next Sync), then
        // send them home where it waits in Upcoming — don't open scoring yet.
        store.setSchedule(scheduledStart, undefined);
        router.push("/");
      } else {
        router.push(`/tournament/round-robin/${id}/matches`);
      }
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
    <VStack align="stretch" gap={6} pb="96px">
      <WizardProgress steps={steps} step={step} />

      <Box>
        {stepName === "Players" && (
          <StepShell
            title={`Who's playing?${attendees.length ? ` (${attendees.length})` : ""}`}
            hint="Tap who turned up. Add anyone new — they're saved for next time."
          >
            <PlayersStep
              selected={attendees}
              onChange={handleAttendeesChange}
              max={MAX_ATTENDEES}
            />
          </StepShell>
        )}

        {stepName === "Format" && (
          <StepShell
            title="How do you want to play?"
            hint="Pick a format. More are on the way."
          >
            <FormatStep value={formatId} onSelect={handleFormat} />
          </StepShell>
        )}

        {stepName === "Sides" && (
          <StepShell
            title="How do you split up?"
            hint="Solo, or team up. Match counts are exact — they don't change with overs."
          >
            <SidesStep
              value={sides}
              onChange={handleSidesChange}
              n={attendees.length}
            />
          </StepShell>
        )}

        {stepName === "Teams" && (
          <StepShell
            title={`Build the teams (${teamCount})`}
            hint="Tap a player, then a slot. Or shuffle and tweak."
          >
            <TeamBuilder
              attendees={attendees}
              size={sides}
              extraMode={extraMode}
              onExtraModeChange={handleExtraModeChange}
              assign={assign}
              onAssignChange={setAssign}
            />
          </StepShell>
        )}

        {stepName === "Finish" && (
          <StepShell
            title="Name it and pick the prize"
            hint={`${teamCount} ${
              sides === 1 ? "players" : "teams"
            } · round-robin${teamCount >= 3 ? " + playoffs" : ""}`}
          >
            <FinishStep
              name={name}
              onName={setName}
              recentNames={recentNames}
              maxOvers={maxOvers}
              onOvers={setMaxOvers}
              maxWickets={maxWickets}
              onWickets={setMaxWickets}
              trophy={trophy}
              onTrophy={setTrophy}
              scheduleMode={scheduleMode}
              onScheduleMode={setScheduleMode}
              scheduledAt={scheduledAt}
              onScheduledAt={setScheduledAt}
              onSubmit={() => stepValid && goNext()}
            />
          </StepShell>
        )}
      </Box>

      <WizardFooter
        showBack={step > 0}
        nextLabel={
          isLast ? (scheduleMode ? "Schedule" : "Start playing") : "Next"
        }
        canProceed={stepValid}
        busy={creating}
        onBack={goBack}
        onNext={goNext}
      />
    </VStack>
  );
}

// ── Steps & chrome ──────────────────────────────────────────────────────────

function WizardProgress({ steps, step }: { steps: string[]; step: number }) {
  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
          {steps[Math.min(step, steps.length - 1)]}
        </Text>
        <Text fontSize="sm" color="fg.muted" fontVariantNumeric="tabular-nums">
          Step {Math.min(step, steps.length - 1) + 1} of {steps.length}
        </Text>
      </HStack>
      <HStack gap={1.5}>
        {steps.map((s, i) => (
          <Box
            key={s}
            flex="1"
            h="4px"
            borderRadius="full"
            bg={i <= step ? "brand.500" : "bg.emphasized"}
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
        <Heading size="lg" fontFamily="heading">
          {title}
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          {hint}
        </Text>
      </VStack>
      {children}
    </VStack>
  );
}

function SidesStep({
  value,
  onChange,
  n,
}: {
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
  n: number;
}) {
  const options: { v: 1 | 2 | 3; label: string; sub: string }[] = [
    { v: 1, label: "Solo", sub: "one player a side" },
    { v: 2, label: "Pairs", sub: "two a side" },
    { v: 3, label: "Teams of 3", sub: "three a side" },
  ];
  return (
    <VStack align="stretch" gap={2.5}>
      {options.map((o) => {
        const t = Math.floor(n / o.v);
        const enabled = t >= 2 && t <= MAX_TEAMS;
        const selected = value === o.v;
        const leftover = n - t * o.v;
        return (
          <Box
            as="button"
            key={o.v}
            onClick={() => enabled && onChange(o.v)}
            aria-pressed={selected}
            aria-disabled={!enabled}
            textAlign="left"
            p={4}
            borderRadius="xl"
            borderWidth={selected ? 2 : 1}
            colorPalette="brand"
            borderColor={selected ? "colorPalette.500" : "border.default"}
            bg={selected ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
            opacity={enabled ? 1 : 0.5}
            cursor={enabled ? "pointer" : "not-allowed"}
            transition="all 0.15s"
            _hover={enabled && !selected ? { borderColor: "colorPalette.300" } : {}}
          >
            <HStack justify="space-between" align="baseline" gap={2}>
              <Text fontFamily="heading" fontWeight="bold" fontSize="md" color="fg.default">
                {o.label}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {enabled ? `${t} ${o.v === 1 ? "players" : "teams"}` : "not enough players"}
              </Text>
            </HStack>
            {enabled ? (
              <HStack
                gap={3}
                mt={2}
                fontSize="xs"
                color="fg.muted"
                fontVariantNumeric="tabular-nums"
              >
                <Text>
                  <Text as="span" fontWeight="semibold" color="fg.default">
                    {rr(t)}
                  </Text>{" "}
                  match{rr(t) === 1 ? "" : "es"}
                </Text>
                <Text>
                  everyone plays{" "}
                  <Text as="span" fontWeight="semibold" color="fg.default">
                    {t - 1}
                  </Text>
                </Text>
                {leftover > 0 && <Text>· {leftover} spare</Text>}
              </HStack>
            ) : (
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {o.sub}
              </Text>
            )}
          </Box>
        );
      })}
    </VStack>
  );
}

function FinishStep({
  name,
  onName,
  recentNames,
  maxOvers,
  onOvers,
  maxWickets,
  onWickets,
  trophy,
  onTrophy,
  scheduleMode,
  onScheduleMode,
  scheduledAt,
  onScheduledAt,
  onSubmit,
}: {
  name: string;
  onName: (v: string) => void;
  recentNames: string[];
  maxOvers: number;
  onOvers: (n: number) => void;
  maxWickets: number;
  onWickets: (n: number) => void;
  trophy: TrophyConfig;
  onTrophy: (t: TrophyConfig) => void;
  scheduleMode: boolean;
  onScheduleMode: (v: boolean) => void;
  scheduledAt: string;
  onScheduledAt: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <VStack align="stretch" gap={5}>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          Name
        </Text>
        <Input
          placeholder="e.g. Sunday Cup"
          value={name}
          onChange={(e) => onName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
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
        {recentNames.length > 0 && (
          <HStack gap={2} mt={2} flexWrap="wrap">
            {recentNames.map((n) => (
              <Box
                as="button"
                key={n}
                onClick={() => onName(n)}
                aria-pressed={name === n}
                px={3}
                py={1.5}
                borderRadius="full"
                borderWidth="1px"
                colorPalette="brand"
                borderColor={name === n ? "colorPalette.500" : "border.default"}
                bg={name === n ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ borderColor: "colorPalette.300" }}
              >
                <Text fontSize="xs" fontWeight="medium" color="fg.default" lineClamp={1}>
                  {n}
                </Text>
              </Box>
            ))}
          </HStack>
        )}
      </Box>

      {/* Play now, or park it in Upcoming for a chosen day. */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          When?
        </Text>
        <HStack gap={2} align="stretch">
          <WhenOption
            label="Play now"
            selected={!scheduleMode}
            onClick={() => onScheduleMode(false)}
          />
          <WhenOption
            label="Schedule"
            selected={scheduleMode}
            onClick={() => onScheduleMode(true)}
          />
        </HStack>
        {scheduleMode && (
          <Input
            type="datetime-local"
            mt={2}
            value={scheduledAt}
            onChange={(e) => onScheduledAt(e.target.value)}
            size="lg"
            bg="input.bg"
            borderColor="input.border"
            color="fg.default"
            _focus={{
              borderColor: "input.focusBorder",
              boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
            }}
          />
        )}
      </Box>
      <HStack gap={3} align="start">
        <Box flex="1">
          <NumberField
            label="Overs"
            helper="per match"
            value={maxOvers}
            min={1}
            max={50}
            onChange={onOvers}
          />
        </Box>
        <Box flex="1">
          <NumberField
            label="Wickets"
            helper="per side"
            value={maxWickets}
            min={1}
            max={11}
            onChange={onWickets}
          />
        </Box>
      </HStack>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
          Trophy for the winner
        </Text>
        <TrophyDesigner config={trophy} onChange={onTrophy} />
      </Box>
    </VStack>
  );
}

function WhenOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      aria-pressed={selected}
      flex="1"
      minW={0}
      py={3}
      borderRadius="lg"
      borderWidth={selected ? 2 : 1}
      colorPalette="brand"
      borderColor={selected ? "colorPalette.500" : "border.default"}
      bg={selected ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
      cursor="pointer"
      transition="all 0.15s"
      textAlign="center"
    >
      <Text fontSize="sm" fontWeight="medium" color="fg.default">
        {label}
      </Text>
    </Box>
  );
}

function WizardFooter({
  showBack,
  nextLabel,
  canProceed,
  busy,
  onBack,
  onNext,
}: {
  showBack: boolean;
  nextLabel: string;
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
        {showBack && (
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
          {nextLabel}
        </Button>
      </HStack>
    </Box>
  );
}
