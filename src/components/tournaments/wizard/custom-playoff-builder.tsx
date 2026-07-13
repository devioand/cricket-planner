"use client";

import {
  Box,
  Card,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPlus, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import type {
  PlayoffConfig,
  PlayoffMatchSpec,
  PlayoffSlot,
} from "@/contexts/tournament-context/types";
import { validatePlayoffConfig } from "@/contexts/tournament-context/algorithms/playoff-config-validation";

interface CustomPlayoffBuilderProps {
  teamCount: number;
  value: PlayoffConfig;
  onChange: (config: PlayoffConfig) => void;
  /** Show the qualifiers picker. Hidden when the count is chosen elsewhere. */
  showQualifiers?: boolean;
}

/** Next unused PO-00N id given the current matches. */
function nextMatchId(matches: PlayoffMatchSpec[]): string {
  let max = 0;
  for (const m of matches) {
    const n = Number(m.id.replace(/^PO-/, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `PO-${String(max + 1).padStart(3, "0")}`;
}

const SLOT_KINDS: { kind: PlayoffSlot["kind"]; label: string }[] = [
  { kind: "seed", label: "Seed" },
  { kind: "winnerOf", label: "Winner of" },
  { kind: "loserOf", label: "Loser of" },
];

export function CustomPlayoffBuilder({
  teamCount,
  value,
  onChange,
  showQualifiers = true,
}: CustomPlayoffBuilderProps) {
  const { qualifiers, matches } = value;
  const validation = validatePlayoffConfig(value, teamCount);

  const patch = (next: Partial<PlayoffConfig>) =>
    onChange({ ...value, ...next });

  const setQualifiers = (n: number) => {
    const clamped = Math.max(2, Math.min(teamCount, n));
    patch({ qualifiers: clamped });
  };

  const updateMatch = (id: string, next: Partial<PlayoffMatchSpec>) =>
    patch({
      matches: matches.map((m) => (m.id === id ? { ...m, ...next } : m)),
    });

  const setSlot = (
    id: string,
    slotKey: "slot1" | "slot2",
    slot: PlayoffSlot,
  ) => updateMatch(id, { [slotKey]: slot } as Partial<PlayoffMatchSpec>);

  const setFinal = (id: string) =>
    patch({
      matches: matches.map((m) => ({ ...m, isFinal: m.id === id })),
    });

  const addMatch = () => {
    const id = nextMatchId(matches);
    const spec: PlayoffMatchSpec = {
      id,
      label: `Match ${matches.length + 1}`,
      round: matches.length + 1,
      slot1: { kind: "seed", seed: 1 },
      slot2: { kind: "seed", seed: 2 },
      isFinal: matches.length === 0, // first match defaults to the final
    };
    patch({ matches: [...matches, spec] });
  };

  const removeMatch = (id: string) => {
    const remaining = matches
      .filter((m) => m.id !== id)
      // Drop references to the removed match so we never leave a dangling ref.
      .map((m) => ({
        ...m,
        slot1: clearRef(m.slot1, id),
        slot2: clearRef(m.slot2, id),
      }));
    // Ensure a final still exists.
    if (remaining.length > 0 && !remaining.some((m) => m.isFinal)) {
      remaining[remaining.length - 1] = {
        ...remaining[remaining.length - 1],
        isFinal: true,
      };
    }
    patch({ matches: remaining });
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Qualifiers */}
      {showQualifiers && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            How many teams qualify?
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {Array.from(
              { length: Math.max(0, teamCount - 1) },
              (_, i) => i + 2,
            ).map((n) => (
              <Chip
                key={n}
                active={qualifiers === n}
                onClick={() => setQualifiers(n)}
              >
                {n}
              </Chip>
            ))}
          </HStack>
          <Text fontSize="xs" color="fg.muted" mt={1}>
            Top {qualifiers} of {teamCount} teams reach the playoffs.
          </Text>
        </Box>
      )}

      {/* Matches */}
      <VStack align="stretch" gap={3}>
        {matches.map((match) => (
          <Card.Root key={match.id} borderWidth={1} borderColor="card.border">
            <Card.Body p={3}>
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between" gap={2}>
                  <Input
                    value={match.label}
                    onChange={(e) =>
                      updateMatch(match.id, { label: e.target.value })
                    }
                    placeholder="Match name"
                    size="sm"
                    maxLength={24}
                    fontWeight="medium"
                    bg="input.bg"
                    borderColor="input.border"
                  />
                  <IconButton
                    aria-label="Remove match"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    disabled={matches.length <= 1}
                    onClick={() => removeMatch(match.id)}
                  >
                    <LuTrash2 />
                  </IconButton>
                </HStack>

                <SlotEditor
                  label="Side 1"
                  slot={match.slot1}
                  qualifiers={qualifiers}
                  others={matches.filter((m) => m.id !== match.id)}
                  onChange={(slot) => setSlot(match.id, "slot1", slot)}
                />
                <SlotEditor
                  label="Side 2"
                  slot={match.slot2}
                  qualifiers={qualifiers}
                  others={matches.filter((m) => m.id !== match.id)}
                  onChange={(slot) => setSlot(match.id, "slot2", slot)}
                />

                <Chip
                  active={!!match.isFinal}
                  onClick={() => setFinal(match.id)}
                  colorPalette="yellow"
                >
                  {match.isFinal ? "🏆 Decides the champion" : "Mark as final"}
                </Chip>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}

        <Button onClick={addMatch} variant="outline" colorPalette="orange" w="full">
          <HStack gap={2}>
            <LuPlus />
            <Text>Add playoff match</Text>
          </HStack>
        </Button>
      </VStack>

      {/* Validation */}
      {!validation.valid && (
        <Card.Root
          borderWidth={1}
          borderColor={{ base: "red.200", _dark: "red.800" }}
          bg={{ base: "red.50", _dark: "red.950" }}
        >
          <Card.Body p={3}>
            <VStack align="stretch" gap={1.5}>
              <HStack gap={2} color={{ base: "red.600", _dark: "red.300" }}>
                <LuTriangleAlert size={16} />
                <Text fontSize="sm" fontWeight="medium">
                  Fix these to continue
                </Text>
              </HStack>
              {validation.errors.map((err, i) => (
                <Text
                  key={i}
                  fontSize="xs"
                  color={{ base: "red.700", _dark: "red.200" }}
                  pl={6}
                >
                  • {err}
                </Text>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}

function clearRef(slot: PlayoffSlot, removedId: string): PlayoffSlot {
  if (
    (slot.kind === "winnerOf" || slot.kind === "loserOf") &&
    slot.matchId === removedId
  ) {
    return { kind: "seed", seed: 1 };
  }
  return slot;
}

interface SlotEditorProps {
  label: string;
  slot: PlayoffSlot;
  qualifiers: number;
  others: PlayoffMatchSpec[];
  onChange: (slot: PlayoffSlot) => void;
}

function SlotEditor({
  label,
  slot,
  qualifiers,
  others,
  onChange,
}: SlotEditorProps) {
  const pickKind = (kind: PlayoffSlot["kind"]) => {
    if (kind === slot.kind) return;
    if (kind === "seed") onChange({ kind: "seed", seed: 1 });
    else {
      const first = others[0]?.id;
      onChange(
        first
          ? ({ kind, matchId: first } as PlayoffSlot)
          : { kind: "seed", seed: 1 },
      );
    }
  };

  return (
    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1.5}>
        {label}
      </Text>
      <HStack gap={1.5} flexWrap="wrap" mb={2}>
        {SLOT_KINDS.map(({ kind, label: kindLabel }) => (
          <Chip
            key={kind}
            active={slot.kind === kind}
            onClick={() => pickKind(kind)}
            size="xs"
          >
            {kindLabel}
          </Chip>
        ))}
      </HStack>

      {slot.kind === "seed" ? (
        <HStack gap={1.5} flexWrap="wrap">
          {Array.from({ length: qualifiers }, (_, i) => i + 1).map((seed) => (
            <Chip
              key={seed}
              size="xs"
              active={slot.seed === seed}
              onClick={() => onChange({ kind: "seed", seed })}
            >
              #{seed}
            </Chip>
          ))}
        </HStack>
      ) : others.length === 0 ? (
        <Text fontSize="xs" color="fg.muted" fontStyle="italic">
          Add another match to reference its result.
        </Text>
      ) : (
        <HStack gap={1.5} flexWrap="wrap">
          {others.map((m) => (
            <Chip
              key={m.id}
              size="xs"
              active={slot.matchId === m.id}
              onClick={() =>
                onChange({ kind: slot.kind, matchId: m.id } as PlayoffSlot)
              }
            >
              {m.label || m.id}
            </Chip>
          ))}
        </HStack>
      )}
    </Box>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "xs" | "sm";
  colorPalette?: string;
}

function Chip({
  active,
  onClick,
  children,
  size = "sm",
  colorPalette = "blue",
}: ChipProps) {
  return (
    <Box
      as="button"
      onClick={onClick}
      colorPalette={colorPalette}
      px={size === "xs" ? 2.5 : 3}
      py={size === "xs" ? 1 : 1.5}
      borderRadius="md"
      borderWidth={1}
      fontSize={size === "xs" ? "xs" : "sm"}
      fontWeight="medium"
      cursor="pointer"
      transition="all 0.12s"
      borderColor={active ? "colorPalette.500" : "border.default"}
      bg={active ? "colorPalette.500" : "card.bg"}
      color={active ? "white" : "fg.default"}
      _hover={active ? {} : { borderColor: "colorPalette.300" }}
    >
      {children}
    </Box>
  );
}
