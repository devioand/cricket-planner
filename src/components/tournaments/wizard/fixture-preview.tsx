"use client";

// A live, in-memory fixture preview for the creation wizard. `buildPreviewState`
// runs the SAME engine reducers TournamentStore.generate uses — but purely, with
// no localStorage/DB writes — so the wizard can show (and share) the exact
// schedule before anything is created. `FixturePreview` renders it with theme
// tokens (unlike the shareable FixtureCard, which is a fixed-style image), and
// shows REAL, data-backed win predictions where enough history exists.

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { LuTrophy } from "react-icons/lu";
import * as engine from "@/contexts/tournament-context/engine";
import type {
  PlayoffSlot,
  TournamentState,
} from "@/contexts/tournament-context/types";
import { predictWin, type FormData } from "@/lib/predictions";
import type { PlayoffSelection } from "./playoff-designer";

/** Build the full fixture state (round-robin + playoffs) from wizard inputs,
 *  with NO side effects. Returns the ungenerated state if teams are invalid. */
export function buildPreviewState(
  teams: string[],
  maxOvers: number,
  maxWickets: number,
  selection: PlayoffSelection,
  scheduledStart?: string,
): TournamentState {
  let s = engine.initialState;
  for (const t of teams) s = engine.addTeam(s, t);
  s = engine.setMaxOvers(s, maxOvers);
  s = engine.setMaxWickets(s, maxWickets);
  s = engine.setPlayoffFormat(s, selection.format);
  s = engine.setPlayoffConfig(s, selection.config);
  if (scheduledStart) s = engine.setSchedule(s, scheduledStart, undefined);
  const res = engine.generateMatches(s);
  return res.success ? res.state : s;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Plain-language description of a playoff slot (no "seed" jargon). */
function describeSlot(slot: PlayoffSlot, labelById: Map<string, string>): string {
  if (slot.kind === "seed") return `${ordinal(slot.seed)} on the table`;
  const l = labelById.get(slot.matchId) ?? "TBD";
  return slot.kind === "winnerOf" ? `Winner · ${l}` : `Loser · ${l}`;
}

export function FixturePreview({
  state,
  formData,
}: {
  state: TournamentState;
  formData: FormData;
}) {
  const group = state.matches
    .filter((m) => !m.isPlayoff)
    .sort((a, b) => a.round - b.round);
  const specs = state.playoffConfig?.matches ?? [];
  const labelById = new Map(specs.map((s) => [s.id, s.label]));

  if (group.length === 0 && specs.length === 0) return null;

  return (
    <VStack align="stretch" gap={5}>
      {group.length > 0 && (
        <Box>
          <SectionLabel count={`${group.length} ${group.length === 1 ? "game" : "games"}`}>
            Group stage
          </SectionLabel>
          <VStack align="stretch" gap={2.5}>
            {group.map((m, i) => (
              <MatchCard
                key={m.id}
                label={`Game ${i + 1}`}
                left={m.team1}
                right={m.team2}
                // Real prediction from past results, or null → honest note.
                prob={predictWin(m.team1, m.team2, formData)}
                note="Not enough past games to predict"
              />
            ))}
          </VStack>
        </Box>
      )}
      {specs.length > 0 && (
        <Box>
          <SectionLabel>Playoffs</SectionLabel>
          <VStack align="stretch" gap={2.5}>
            {specs.map((spec) => (
              <MatchCard
                key={spec.id}
                label={spec.label}
                left={describeSlot(spec.slot1, labelById)}
                right={describeSlot(spec.slot2, labelById)}
                isFinal={spec.isFinal}
                // Teams aren't known until the group stage finishes, so there's
                // nothing real to predict yet.
                prob={null}
                note="Teams set after the group stage"
              />
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

function SectionLabel({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: string;
}) {
  return (
    <HStack justify="space-between" align="baseline" mb={2.5}>
      <Text fontSize="sm" fontWeight="bold" fontFamily="heading" color="fg.default">
        {children}
      </Text>
      {count && (
        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
          {count}
        </Text>
      )}
    </HStack>
  );
}

/** A single fixture: label on top, the matchup, then a real win prediction (or
 *  an honest note when there isn't enough history to predict). */
function MatchCard({
  label,
  left,
  right,
  isFinal,
  prob,
  note,
}: {
  label: string;
  left: string;
  right: string;
  isFinal?: boolean;
  prob: number | null;
  note?: string;
}) {
  const p1 = prob === null ? null : Math.round(prob * 100);
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      px={4}
      py={3.5}
      borderColor={isFinal ? { base: "gold.300", _dark: "gold.700" } : "card.border"}
      bg={isFinal ? { base: "gold.50", _dark: "whiteAlpha.50" } : "card.bg"}
    >
      {/* Label + predicted tag */}
      <HStack justify="space-between" align="center" mb={3}>
        <HStack gap={1.5}>
          {isFinal && (
            <Box color={{ base: "gold.600", _dark: "gold.400" }} display="flex">
              <LuTrophy size={13} />
            </Box>
          )}
          <Text
            fontSize="xs"
            fontWeight="bold"
            letterSpacing="0.06em"
            textTransform="uppercase"
            color={isFinal ? { base: "gold.700", _dark: "gold.300" } : "fg.default"}
          >
            {label}
          </Text>
        </HStack>
        {p1 !== null && (
          <Text
            fontSize="2xs"
            fontWeight="semibold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="fg.muted"
          >
            Predicted
          </Text>
        )}
      </HStack>

      {/* Matchup */}
      <HStack gap={3} align="center">
        <Text
          fontSize="md"
          fontWeight="bold"
          color="fg.default"
          flex="1"
          textAlign="right"
          lineHeight="1.2"
          truncate
        >
          {left}
        </Text>
        <Box
          flexShrink={0}
          px={2}
          py={0.5}
          borderRadius="full"
          bg="bg.emphasized"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.05em"
          color="fg.muted"
        >
          VS
        </Box>
        <Text
          fontSize="md"
          fontWeight="bold"
          color="fg.default"
          flex="1"
          lineHeight="1.2"
          truncate
        >
          {right}
        </Text>
      </HStack>

      {/* Real win prediction, or an honest no-data note */}
      {p1 !== null ? (
        <Box mt={3.5}>
          <Box
            h="7px"
            borderRadius="full"
            overflow="hidden"
            display="flex"
            bg={{ base: "gray.200", _dark: "gray.700" }}
          >
            <Box w={`${p1}%`} bg="brand.500" transition="width 0.2s" />
          </Box>
          <HStack justify="space-between" mt={1.5}>
            <Text
              fontSize="2xs"
              fontWeight="bold"
              color={{ base: "brand.600", _dark: "brand.300" }}
            >
              {p1}%
            </Text>
            <Text fontSize="2xs" fontWeight="bold" color="fg.muted">
              {100 - p1}%
            </Text>
          </HStack>
        </Box>
      ) : note ? (
        <Text mt={3} fontSize="xs" color="fg.muted">
          {note}
        </Text>
      ) : null}
    </Box>
  );
}
