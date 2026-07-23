"use client";

// A live, in-memory fixture preview for the creation wizard. `buildPreviewState`
// runs the SAME engine reducers TournamentStore.generate uses — but purely, with
// no localStorage/DB writes — so the wizard can show (and share) the exact
// schedule before anything is created. `FixturePreview` renders it with theme
// tokens (unlike the shareable FixtureCard, which is a fixed-style image), and
// shows REAL, data-backed win predictions where enough history exists.

import { useState } from "react";
import {
  Box,
  CloseButton,
  Dialog,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuInfo, LuTrophy } from "react-icons/lu";
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

/** Plain-language description of a playoff slot (no "seed" jargon). The seed
 *  slots read as a rank in the group table — "Table #1", "Table #2", … */
function describeSlot(slot: PlayoffSlot, labelById: Map<string, string>): string {
  if (slot.kind === "seed") return `Table #${slot.seed}`;
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

/** A single fixture: a centered label on top, the matchup, then a real,
 *  data-backed win prediction. Each team's chance sits directly under its own
 *  name and shares that side's colour, so there's no doubt which number is
 *  whose. Falls back to an honest note when there isn't enough history. */
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
  const p2 = p1 === null ? null : 100 - p1;
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      px={4}
      py={3.5}
      borderColor={isFinal ? { base: "gold.300", _dark: "gold.700" } : "card.border"}
      bg={isFinal ? { base: "gold.50", _dark: "whiteAlpha.50" } : "card.bg"}
    >
      {/* Label centered on top (trophy for the final) */}
      <HStack justify="center" gap={1.5} mb={3}>
        {isFinal && (
          <Box color={{ base: "gold.600", _dark: "gold.400" }} display="flex">
            <LuTrophy size={13} />
          </Box>
        )}
        <Text
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color={isFinal ? { base: "gold.700", _dark: "gold.300" } : "fg.muted"}
        >
          {label}
        </Text>
      </HStack>

      {/* Matchup — each name hugs its own side of a centered VS, so it lines up
          with that side's percentage below. */}
      <HStack gap={2.5} align="center">
        <Text
          flex="1"
          textAlign="left"
          fontSize="md"
          fontWeight="bold"
          color="fg.default"
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
          flex="1"
          textAlign="right"
          fontSize="md"
          fontWeight="bold"
          color="fg.default"
          lineHeight="1.2"
          truncate
        >
          {right}
        </Text>
      </HStack>

      {/* Win prediction: one split bar, then each team's chance directly under
          its name and colour-matched to its slice of the bar. */}
      {p1 !== null ? (
        <Box mt={3}>
          <Box
            h="8px"
            borderRadius="full"
            overflow="hidden"
            display="flex"
            bg={{ base: "gray.200", _dark: "gray.700" }}
          >
            <Box w={`${p1}%`} bg="brand.solid" transition="width 0.2s" />
            <Box flex="1" bg={{ base: "gray.400", _dark: "gray.500" }} />
          </Box>
          <HStack justify="space-between" mt={2} align="baseline" gap={2}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={{ base: "brand.600", _dark: "brand.300" }}
            >
              {p1}%
            </Text>
            <HStack flexShrink={0} gap={1} align="center">
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                letterSpacing="0.08em"
                textTransform="uppercase"
                color="fg.muted"
                whiteSpace="nowrap"
              >
                Winning prediction
              </Text>
              <PredictionInfo />
            </HStack>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={{ base: "gray.700", _dark: "gray.300" }}
            >
              {p2}%
            </Text>
          </HStack>
        </Box>
      ) : note ? (
        <Text mt={3} fontSize="xs" color="fg.muted" textAlign="center">
          {note}
        </Text>
      ) : null}
    </Box>
  );
}

/** The little "how is this worked out?" affordance next to a prediction. Taps
 *  open a plain-language explanation of the real algorithm — no hover tooltip,
 *  since this is used on a phone. */
function PredictionInfo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        as="button"
        onClick={() => setOpen(true)}
        aria-label="How is the winning prediction worked out?"
        display="flex"
        flexShrink={0}
        color="fg.muted"
        _hover={{ color: "fg.default" }}
      >
        <LuInfo size={13} />
      </Box>
      <Dialog.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        scrollBehavior="inside"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content maxW="400px" mx={4} bg="dialog.bg" borderRadius="xl">
              <Dialog.Header pb={2}>
                <Dialog.Title fontSize="md" fontWeight="600">
                  How the winning prediction works
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    position="absolute"
                    top={4}
                    right={4}
                    size="sm"
                    color="fg.muted"
                    _hover={{ color: "fg.default", bg: "bg.subtle" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body pb={5}>
                <VStack align="stretch" gap={3}>
                  <Text fontSize="sm" color="fg.muted">
                    The percentages come from both teams&apos; real results in
                    past completed tournaments — never made-up numbers.
                  </Text>
                  <VStack align="stretch" gap={2}>
                    <InfoRow title="Recent form">
                      Each team&apos;s win rate, nudged a little by its net run
                      rate.
                    </InfoRow>
                    <InfoRow title="Head-to-head">
                      How often these two have beaten each other. The more
                      they&apos;ve played, the more it counts.
                    </InfoRow>
                  </VStack>
                  <Text fontSize="xs" color="fg.muted">
                    We blend the two and keep every prediction between 15% and
                    85%, so a handful of games never turns into a near-certainty.
                    When there isn&apos;t enough history, we show no number
                    instead of inventing one.
                  </Text>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

function InfoRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="card.border"
      borderRadius="lg"
      px={3}
      py={2.5}
    >
      <Text fontSize="sm" fontWeight="bold" color="fg.default" mb={0.5}>
        {title}
      </Text>
      <Text fontSize="xs" color="fg.muted">
        {children}
      </Text>
    </Box>
  );
}
