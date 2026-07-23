"use client";

// Build the sides for a tournament from a flat list of players.
//
// The engine runs on team-NAME strings — a "team" is just a name, and for a
// solo tournament that name is the player. So this builder's whole job is to
// turn picked players into composite team names ("Asad + Usman") that the
// existing round-robin + playoff engine already understands. No engine change.
//
// Manual-first: the builder opens empty and you place each player yourself
// (tap a player, tap a slot). Shuffle is a helper, not the default. When the
// head count doesn't divide evenly the builder asks — bigger team, or sit the
// extras out — rather than deciding for you.

import { Box, HStack, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { useState } from "react";
import { LuShuffle, LuX } from "react-icons/lu";

/** name → team index (0-based), or BENCH for a player sitting out. */
export const BENCH = -1;
export type Assignment = Record<string, number>;

export interface TeamPlan {
  /** Capacity of each team, in order. */
  caps: number[];
  /** How many players sit out (only in "sit out" mode with an odd count). */
  benchCap: number;
}

/**
 * How `n` players split into teams of `size`, given the odd-number choice.
 * "bigger" absorbs the leftovers into the first teams; "sitout" benches them.
 */
export function teamPlan(
  n: number,
  size: number,
  extraMode: "bigger" | "sitout",
): TeamPlan {
  const base = Math.floor(n / size);
  const remainder = n % size;
  if (base < 1) return { caps: [], benchCap: 0 };
  if (remainder === 0) return { caps: Array(base).fill(size), benchCap: 0 };
  if (extraMode === "sitout") {
    return { caps: Array(base).fill(size), benchCap: remainder };
  }
  const caps: number[] = Array(base).fill(size);
  for (let i = 0; i < remainder; i += 1) caps[i] += 1; // one bigger team per extra
  return { caps, benchCap: 0 };
}

export interface BuiltTeams {
  caps: number[];
  benchCap: number;
  /** Players in each team, in order. */
  members: string[][];
  /** Players deliberately sitting out. */
  benched: string[];
  /** Players not placed anywhere yet. */
  unassigned: string[];
  /** Composite team names ("Asad + Usman"), one per team (may be partial). */
  teams: string[];
  /** True when every team is full and no one is left unassigned. */
  complete: boolean;
}

/** Resolve an assignment map into concrete teams + validity. Pure. */
export function buildTeams(
  attendees: string[],
  size: number,
  extraMode: "bigger" | "sitout",
  assign: Assignment,
): BuiltTeams {
  const { caps, benchCap } = teamPlan(attendees.length, size, extraMode);
  const members: string[][] = caps.map(() => []);
  const benched: string[] = [];
  const unassigned: string[] = [];

  for (const name of attendees) {
    const idx = assign[name];
    if (idx === BENCH && benched.length < benchCap) {
      benched.push(name);
    } else if (
      typeof idx === "number" &&
      idx >= 0 &&
      idx < caps.length &&
      members[idx].length < caps[idx]
    ) {
      members[idx].push(name);
    } else {
      unassigned.push(name);
    }
  }

  const complete =
    unassigned.length === 0 &&
    members.every((m, i) => m.length === caps[i]) &&
    benched.length === benchCap;

  return {
    caps,
    benchCap,
    members,
    benched,
    unassigned,
    teams: members.map((m) => m.join(" + ")),
    complete,
  };
}

/** Drop assignments for players who are no longer attending. Pure. */
export function pruneAssignment(assign: Assignment, attendees: string[]): Assignment {
  const present = new Set(attendees);
  let changed = false;
  const next: Assignment = {};
  for (const [name, idx] of Object.entries(assign)) {
    if (present.has(name)) next[name] = idx;
    else changed = true;
  }
  return changed ? next : assign;
}

interface TeamBuilderProps {
  attendees: string[];
  size: number;
  extraMode: "bigger" | "sitout";
  onExtraModeChange: (mode: "bigger" | "sitout") => void;
  assign: Assignment;
  onAssignChange: (next: Assignment) => void;
}

export function TeamBuilder({
  attendees,
  size,
  extraMode,
  onExtraModeChange,
  assign,
  onAssignChange,
}: TeamBuilderProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const { caps, benchCap, members, benched } = buildTeams(
    attendees,
    size,
    extraMode,
    assign,
  );

  const assigned = new Set([...members.flat(), ...benched]);
  const pool = attendees.filter((a) => !assigned.has(a));
  const remainder = attendees.length % size;

  const place = (idx: number) => {
    if (!selected) return;
    if (idx >= 0 && members[idx].length >= caps[idx]) return;
    if (idx === BENCH && benched.length >= benchCap) return;
    onAssignChange({ ...assign, [selected]: idx });
    setSelected(null);
  };

  const unassign = (name: string) => {
    const next = { ...assign };
    delete next[name];
    onAssignChange(next);
    if (selected === name) setSelected(null);
  };

  const shuffle = () => {
    const shuffled = [...attendees];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const next: Assignment = {};
    let idx = 0;
    caps.forEach((cap, ti) => {
      for (let s = 0; s < cap && idx < shuffled.length; s += 1) {
        next[shuffled[idx]] = ti;
        idx += 1;
      }
    });
    for (let b = 0; b < benchCap && idx < shuffled.length; b += 1) {
      next[shuffled[idx]] = BENCH;
      idx += 1;
    }
    onAssignChange(next);
    setSelected(null);
  };

  const clear = () => {
    onAssignChange({});
    setSelected(null);
  };

  return (
    <VStackLike>
      {/* Odd number: ask, never guess */}
      {remainder > 0 && (
        <HStack gap={2} flexWrap="wrap" mb={1}>
          <Text fontSize="xs" color="fg.muted">
            {remainder} left over:
          </Text>
          <Segmented
            options={[
              { value: "bigger", label: remainder > 1 ? "Bigger teams" : "Bigger team" },
              { value: "sitout", label: remainder > 1 ? `Sit ${remainder} out` : "Sit out" },
            ]}
            value={extraMode}
            onChange={(v) => onExtraModeChange(v as "bigger" | "sitout")}
          />
        </HStack>
      )}

      {/* Unassigned pool */}
      <Box>
        <HStack justify="space-between" align="baseline" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            {pool.length > 0 ? "Tap a player, then a slot" : "Everyone placed"}
          </Text>
          {pool.length === 0 && (
            <Text fontSize="xs" color="green.500" fontWeight="medium">
              ✓ ready
            </Text>
          )}
        </HStack>
        {pool.length > 0 ? (
          <Wrap gap={2}>
            {pool.map((name) => (
              <WrapItem key={name}>
                <Chip
                  label={name}
                  pressed={selected === name}
                  onClick={() => setSelected(selected === name ? null : name)}
                />
              </WrapItem>
            ))}
          </Wrap>
        ) : (
          <Text fontSize="xs" color="fg.muted">
            Every player is in a team below. Tap a name to move them.
          </Text>
        )}
      </Box>

      <HStack gap={4} mt={1}>
        <TextButton onClick={shuffle}>
          <LuShuffle size={13} /> Shuffle for me
        </TextButton>
        {Object.keys(assign).length > 0 && (
          <TextButton onClick={clear} tone="muted">
            Clear
          </TextButton>
        )}
      </HStack>

      {/* Team cards */}
      <VStackLike gap={2.5} mt={1}>
        {members.map((team, ti) => (
          <SlotCard
            key={ti}
            title={team.length === caps[ti] ? team.join(" + ") : `Team ${ti + 1}`}
            cap={caps[ti]}
            filled={team}
            armed={!!selected && team.length < caps[ti]}
            onPlace={() => place(ti)}
            onRemove={unassign}
          />
        ))}
        {benchCap > 0 && (
          <SlotCard
            title="Sitting out"
            cap={benchCap}
            filled={benched}
            armed={!!selected && benched.length < benchCap}
            onPlace={() => place(BENCH)}
            onRemove={unassign}
            bench
          />
        )}
      </VStackLike>
    </VStackLike>
  );
}

// ── Small themed primitives (kept local; nothing here is reused elsewhere) ────

function VStackLike({
  children,
  gap = 4,
  mt,
}: {
  children: React.ReactNode;
  gap?: number;
  mt?: number;
}) {
  return (
    <Box display="flex" flexDirection="column" gap={gap} mt={mt} alignItems="stretch">
      {children}
    </Box>
  );
}

function Chip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      aria-pressed={pressed}
      h="44px"
      px={4}
      borderRadius="full"
      borderWidth="1px"
      display="flex"
      alignItems="center"
      cursor="pointer"
      transition="all 0.15s"
      bg={pressed ? "brand.500" : "card.bg"}
      color={pressed ? "white" : "fg.default"}
      borderColor={pressed ? "brand.500" : "card.border"}
      _hover={{ borderColor: "brand.300" }}
    >
      <Text fontSize="sm" fontWeight="medium">
        {label}
      </Text>
    </Box>
  );
}

function SlotCard({
  title,
  cap,
  filled,
  armed,
  onPlace,
  onRemove,
  bench = false,
}: {
  title: string;
  cap: number;
  filled: string[];
  armed: boolean;
  onPlace: () => void;
  onRemove: (name: string) => void;
  bench?: boolean;
}) {
  const empties = cap - filled.length;
  return (
    <Box
      borderWidth="1px"
      borderStyle={bench ? "dashed" : "solid"}
      borderColor={armed ? "brand.400" : "card.border"}
      bg="card.bg"
      borderRadius="lg"
      px={3}
      py={2.5}
      transition="border-color 0.15s"
    >
      <Text
        fontSize="xs"
        fontWeight="medium"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb={2}
      >
        {title}
      </Text>
      <Wrap gap={2}>
        {filled.map((name) => (
          <WrapItem key={name}>
            <Box
              as="button"
              onClick={() => onRemove(name)}
              h="38px"
              px={3}
              borderRadius="full"
              display="flex"
              alignItems="center"
              gap={1.5}
              cursor="pointer"
              bg={{ base: "brand.50", _dark: "brand.950" }}
              color={{ base: "brand.700", _dark: "brand.200" }}
              borderWidth="1px"
              borderColor={{ base: "brand.200", _dark: "brand.800" }}
              _hover={{ borderColor: "brand.400" }}
            >
              <Text fontSize="sm" fontWeight="medium">
                {name}
              </Text>
              <LuX size={13} />
            </Box>
          </WrapItem>
        ))}
        {Array.from({ length: empties }).map((_, i) => (
          <WrapItem key={`empty-${i}`}>
            <Box
              as="button"
              onClick={onPlace}
              aria-disabled={!armed}
              h="38px"
              px={3}
              borderRadius="full"
              display="flex"
              alignItems="center"
              cursor={armed ? "pointer" : "default"}
              bg="bg.subtle"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor={armed ? "brand.400" : "border.muted"}
              color={armed ? "brand.500" : "fg.subtle"}
              transition="all 0.15s"
            >
              <Text fontSize="sm">{armed ? "＋ place here" : "＋ empty"}</Text>
            </Box>
          </WrapItem>
        ))}
      </Wrap>
    </Box>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <HStack
      gap={0}
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="full"
      overflow="hidden"
    >
      {options.map((o) => (
        <Box
          as="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          px={3}
          h="34px"
          display="flex"
          alignItems="center"
          fontSize="xs"
          fontWeight="medium"
          cursor="pointer"
          bg={value === o.value ? "brand.500" : "transparent"}
          color={value === o.value ? "white" : "fg.muted"}
          transition="all 0.15s"
        >
          {o.label}
        </Box>
      ))}
    </HStack>
  );
}

function TextButton({
  children,
  onClick,
  tone = "accent",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "accent" | "muted";
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap={1.5}
      fontSize="sm"
      fontWeight="medium"
      cursor="pointer"
      color={tone === "accent" ? "brand.500" : "fg.muted"}
      _hover={{ textDecoration: "underline" }}
    >
      {children}
    </Box>
  );
}
