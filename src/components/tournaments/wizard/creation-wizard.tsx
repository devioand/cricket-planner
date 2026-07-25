"use client";

import { Box, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { createTournamentAction } from "@/app/tournaments/actions";
import { markPlayedAction } from "@/app/club/actions";
import { syncTournamentAction } from "@/app/tournament/round-robin/[id]/actions";
import { LuShare2 } from "react-icons/lu";
import { FixtureShareDialog } from "@/components/tournaments/fixture-share-dialog";
import { BOTTOM_NAV_HEIGHT, useNavVisible } from "@/components/layout/nav-items";
import { TournamentStore } from "@/lib/local/tournament-store";
import { initialState } from "@/contexts/tournament-context/engine";
import { EMPTY_FORM, type FormData } from "@/lib/predictions";
import type {
  PlayoffConfig,
  SeriesBestOf,
  TournamentState,
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
import { PlayersStep, type PickerPlayer } from "./players-step";
import { FormatStep, FORMATS, type FormatSpec } from "./format-step";
import { NumberField } from "./number-field";
import {
  PlayoffStep,
  choiceToSelection,
  playoffChoices,
  defaultPlayoffChoice,
  type PlayoffChoice,
} from "./playoff-step";
import { buildPreviewState, FixturePreview } from "./fixture-preview";
import { gamesToWin } from "@/contexts/tournament-context/algorithms/series";

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

type StepName =
  | "Players"
  | "Format"
  | "Sides"
  | "Teams"
  | "Playoffs"
  | "BestOf"
  | "Details"
  | "Fixture";

export function CreationWizard({
  recentNames = [],
  clubPlayers = [],
  clubId: initialClubId = null,
  formData = EMPTY_FORM,
}: {
  recentNames?: string[];
  clubPlayers?: PickerPlayer[];
  clubId?: string | null;
  formData?: FormData;
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [attendees, setAttendees] = useState<string[]>([]);
  // Active club id — may be created lazily by the Players step's add-player.
  const [clubId, setClubId] = useState<string | null>(initialClubId);
  const [formatId, setFormatId] = useState<string>("round-robin");
  const [sides, setSides] = useState<1 | 2 | 3>(1);
  const [extraMode, setExtraMode] = useState<"bigger" | "sitout">("bigger");
  const [assign, setAssign] = useState<Assignment>({});
  const [name, setName] = useState("");
  const [maxOvers, setMaxOvers] = useState(20);
  const [maxWickets, setMaxWickets] = useState(10);
  const [trophy, setTrophy] = useState<TrophyConfig>(DEFAULT_TROPHY);
  const [playoffChoice, setPlayoffChoice] = useState<PlayoffChoice>("world-cup");
  const [customConfig, setCustomConfig] = useState<PlayoffConfig>(DEFAULT_CUSTOM);
  const [seriesBestOf, setSeriesBestOf] = useState<SeriesBestOf>(3);
  // Empty = play now. A datetime-local value parks the game in Upcoming.
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [creating, setCreating] = useState(false);

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const algorithm: TournamentType = format.algorithm ?? "round-robin";
  // A series is always exactly two sides, best-of-N — no group table, no
  // playoffs, so those steps are swapped out below.
  const isSeries = format.id === "series";
  // A tri-series is always exactly three sides, double round-robin, and the
  // champion is always decided by a fixed top-2 final — no playoff choice.
  const isTriSeries = format.id === "tri-series";
  // The side size a format pins the team count to (series: 2, tri-series: 3),
  // or undefined for formats that just need 2+ teams.
  const requiredTeams = isSeries ? 2 : isTriSeries ? 3 : undefined;

  // Turn attendees + a side size into the team-name strings the engine runs on.
  const built = buildTeams(attendees, sides, extraMode, assign);
  const teams = sides === 1 ? attendees : built.teams;
  const teamCount = sides === 1 ? attendees.length : built.caps.length;
  const teamsComplete = sides === 1 ? attendees.length >= 2 : built.complete;

  // Steps are dynamic: solo skips the team-building screen; a series picks its
  // best-of length instead of playoffs (it's always exactly 2 sides); a
  // tri-series has no playoff choice at all (always top-2-into-a-final);
  // playoffs otherwise only make sense with 3+ teams (2 teams is a single
  // decider).
  const steps: StepName[] = [
    "Players",
    "Format",
    "Sides",
    ...(sides > 1 ? (["Teams"] as StepName[]) : []),
    ...(isSeries
      ? (["BestOf"] as StepName[])
      : isTriSeries
        ? []
        : teamCount >= 3
          ? (["Playoffs"] as StepName[])
          : []),
    "Details",
    "Fixture",
  ];
  const stepName = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  // Playoffs sit on top of the round-robin table. Clamp the saved choice to what
  // the current field size supports, then resolve it for the engine.
  const effChoice: PlayoffChoice = playoffChoices(teamCount).includes(playoffChoice)
    ? playoffChoice
    : defaultPlayoffChoice(teamCount);
  const selection = choiceToSelection(effChoice, customConfig, teamCount);

  // One-line description of the match format, reused on the last two steps.
  const formatSummary = isSeries
    ? `best of ${seriesBestOf}`
    : isTriSeries
      ? "double round-robin + final"
      : `round-robin${teamCount >= 3 && effChoice !== "none" ? " + playoffs" : ""}`;

  // A live, side-effect-free preview of the exact fixtures this will create —
  // shown (and shareable) on the final step before anything is persisted.
  const scheduledStartISO =
    scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
  const previewState = buildPreviewState(
    teams,
    maxOvers,
    maxWickets,
    selection,
    scheduledStartISO,
    algorithm,
    seriesBestOf,
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
  // Series/tri-series pin the team count to an exact number; every other
  // format just needs 2+.
  const sizeEnabled = (size: number) => {
    const t = teamsForSize(size);
    return requiredTeams !== undefined
      ? t === requiredTeams
      : t >= 2 && t <= MAX_TEAMS;
  };

  const finishReady =
    name.trim().length > 0 &&
    maxOvers >= 1 &&
    maxWickets >= 1 &&
    teamCount >= 2 &&
    teamCount <= MAX_TEAMS &&
    teamsComplete &&
    (!scheduleMode || scheduledAt !== "");

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
      case "Playoffs":
        return selection.valid;
      case "BestOf":
        return true;
      case "Details":
      case "Fixture":
        return finishReady;
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
      // A series has no playoffs; a tri-series always ends in a top-2 final —
      // persist those rather than whatever stale playoff choice is sitting
      // in wizard state.
      const playoffFormat = isSeries
        ? "none"
        : isTriSeries
          ? "final-only"
          : selection.format;
      const { id } = await createTournamentAction(
        {
          name: name.trim(),
          algorithm,
          playoffFormat,
          maxOvers,
          maxWickets,
          scheduledStart,
        },
        clubId,
      );
      const store = new TournamentStore({
        id,
        name: name.trim(),
        status: "setup",
        state: initialState,
      });
      const res = store.generate({
        teams,
        algorithm,
        maxOvers,
        maxWickets,
        playoffFormat,
        playoffConfig: isSeries || isTriSeries ? null : selection.config,
        seriesBestOf: isSeries ? seriesBestOf : undefined,
        trophy,
      });
      if (!res.success) throw new Error(res.errors?.[0] ?? "Generate failed");
      // Stamp who turned out so the picker leads with regulars next time.
      if (clubId) await markPlayedAction(clubId, attendees);
      if (scheduledStart) {
        // Mirror the schedule into local state, then persist right away so
        // the Upcoming card on the homepage shows the real team count
        // instead of 0 — otherwise nothing writes the teams to the DB until
        // this device opens the tournament again and hits Sync.
        store.setSchedule(scheduledStart, undefined);
        try {
          const { updatedAt } = await syncTournamentAction(
            id,
            store.getSnapshot().state,
          );
          store.markSynced(updatedAt);
        } catch (err) {
          // Non-fatal: still saved locally on this device and will sync
          // next time it's opened.
          console.error("Failed to sync scheduled tournament:", err);
        }
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
              players={clubPlayers}
              clubId={clubId}
              onClubId={setClubId}
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
            hint={
              isSeries
                ? "A series is head-to-head — pick a side size that splits everyone into exactly 2 teams."
                : isTriSeries
                  ? "A tri-series needs exactly 3 sides — pick a side size that splits everyone evenly into 3."
                  : "Solo, or team up. Match counts are exact — they don't change with overs."
            }
          >
            <SidesStep
              value={sides}
              onChange={handleSidesChange}
              n={attendees.length}
              exactTeams={requiredTeams}
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

        {stepName === "Playoffs" && (
          <StepShell
            title="How is the champion decided?"
            hint="Off the round-robin table — pick a knockout, or build your own."
          >
            <PlayoffStep
              teamCount={teamCount}
              choice={effChoice}
              onChoice={setPlayoffChoice}
              customConfig={customConfig}
              onCustomConfig={setCustomConfig}
            />
          </StepShell>
        )}

        {stepName === "BestOf" && (
          <StepShell
            title="Best of how many?"
            hint="The series ends the moment either side can't be caught."
          >
            <BestOfStep value={seriesBestOf} onChange={setSeriesBestOf} />
          </StepShell>
        )}

        {stepName === "Details" && (
          <StepShell
            title="Name it and pick the prize"
            hint={`${teamCount} ${
              sides === 1 ? "players" : "teams"
            } · ${formatSummary}`}
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

        {stepName === "Fixture" && (
          <StepShell
            title={name.trim() || "Your fixture"}
            hint={`${teamCount} ${
              sides === 1 ? "players" : "teams"
            } · ${formatSummary} · ${maxOvers} overs, ${maxWickets} wkts`}
          >
            <FixtureStep
              previewState={previewState}
              name={name}
              formData={formData}
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
  exactTeams,
}: {
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
  n: number;
  /** When set (series), only a side size that produces exactly this many
   *  teams is selectable — instead of the usual 2..MAX_TEAMS range. */
  exactTeams?: number;
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
        const enabled =
          exactTeams !== undefined ? t === exactTeams : t >= 2 && t <= MAX_TEAMS;
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
                {enabled
                  ? `${t} ${o.v === 1 ? "players" : "teams"}`
                  : exactTeams !== undefined
                    ? `doesn't split into ${exactTeams}`
                    : "not enough players"}
              </Text>
            </HStack>
            {enabled ? (
              exactTeams !== undefined ? (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {leftover > 0
                    ? `${exactTeams} sides · ${leftover} spare`
                    : `${exactTeams} sides`}
                </Text>
              ) : (
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
              )
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

function BestOfStep({
  value,
  onChange,
}: {
  value: SeriesBestOf;
  onChange: (v: SeriesBestOf) => void;
}) {
  const options: SeriesBestOf[] = [3, 5, 7];
  return (
    <VStack align="stretch" gap={2.5}>
      {options.map((v) => {
        const selected = value === v;
        return (
          <Box
            as="button"
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={selected}
            textAlign="left"
            p={4}
            borderRadius="xl"
            borderWidth={selected ? 2 : 1}
            colorPalette="brand"
            borderColor={selected ? "colorPalette.500" : "border.default"}
            bg={selected ? { base: "brand.50", _dark: "brand.950" } : "card.bg"}
            cursor="pointer"
            transition="all 0.15s"
            _hover={!selected ? { borderColor: "colorPalette.300" } : {}}
          >
            <HStack justify="space-between" align="baseline" gap={2}>
              <Text fontFamily="heading" fontWeight="bold" fontSize="md" color="fg.default">
                Best of {v}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                first to {gamesToWin(v)} wins
              </Text>
            </HStack>
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

/** Final review: the exact fixture this will create, with a share action. */
function FixtureStep({
  previewState,
  name,
  formData,
}: {
  previewState: TournamentState;
  name: string;
  formData: FormData;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <VStack align="stretch" gap={4}>
      <FixturePreview state={previewState} formData={formData} />
      <Button
        variant="outline"
        colorPalette="brand"
        size="lg"
        onClick={() => setShareOpen(true)}
      >
        <LuShare2 /> Share fixture
      </Button>
      <FixtureShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        name={name.trim() || "Fixture"}
        state={previewState}
        formData={formData}
      />
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
  // On phones the primary tab bar owns the very bottom of the viewport, so the
  // wizard's actions sit directly above it instead of underneath it.
  const navVisible = useNavVisible();

  return (
    <Box
      position="fixed"
      bottom={{ base: navVisible ? BOTTOM_NAV_HEIGHT : 0, md: 0 }}
      left={0}
      right={0}
      bg="bg.panel"
      borderTopWidth={1}
      borderColor="border.default"
      px={4}
      pt={3}
      pb={{
        base: navVisible ? 3 : "calc(var(--chakra-spacing-3) + env(safe-area-inset-bottom))",
        md: 3,
      }}
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
