"use client";

import {
  Box,
  Card,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  LuChevronDown,
  LuPlus,
  LuTrash2,
  LuTriangleAlert,
  LuTrophy,
} from "react-icons/lu";
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

/** 1 -> "1st", 2 -> "2nd", … so a seed reads as a finishing place. */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Plain-language label for a slot, e.g. "1st place" or "Winner of Final". */
function slotLabel(slot: PlayoffSlot, others: PlayoffMatchSpec[]): string {
  if (slot.kind === "seed") return `${ordinal(slot.seed)} place`;
  const ref = others.find((m) => m.id === slot.matchId);
  const name = ref?.label || slot.matchId;
  return `${slot.kind === "winnerOf" ? "Winner of" : "Loser of"} ${name}`;
}

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

                <HStack gap={2.5} align="center">
                  <Box flex="1" minW={0}>
                    <SidePicker
                      ariaLabel="Side 1"
                      slot={match.slot1}
                      qualifiers={qualifiers}
                      others={matches.filter((m) => m.id !== match.id)}
                      onChange={(slot) => setSlot(match.id, "slot1", slot)}
                    />
                  </Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.muted"
                    flexShrink={0}
                  >
                    vs
                  </Text>
                  <Box flex="1" minW={0}>
                    <SidePicker
                      ariaLabel="Side 2"
                      slot={match.slot2}
                      qualifiers={qualifiers}
                      others={matches.filter((m) => m.id !== match.id)}
                      onChange={(slot) => setSlot(match.id, "slot2", slot)}
                    />
                  </Box>
                </HStack>

                <Box
                  as="button"
                  onClick={() => setFinal(match.id)}
                  aria-pressed={!!match.isFinal}
                  alignSelf="flex-start"
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  borderWidth={1}
                  fontSize="sm"
                  fontWeight="medium"
                  cursor="pointer"
                  transition="all 0.12s"
                  borderColor={
                    match.isFinal
                      ? { base: "gold.400", _dark: "gold.500" }
                      : "border.default"
                  }
                  bg={
                    match.isFinal
                      ? { base: "gold.400", _dark: "gold.500" }
                      : "card.bg"
                  }
                  color={match.isFinal ? "gold.950" : "fg.muted"}
                  _hover={
                    match.isFinal ? {} : { borderColor: "gold.400", color: "fg.default" }
                  }
                >
                  <LuTrophy size={13} />
                  <Text as="span">
                    {match.isFinal ? "Decides the champion" : "Mark as final"}
                  </Text>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}

        <Box
          as="button"
          onClick={addMatch}
          w="full"
          minH="44px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          borderRadius="lg"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={{ base: "brand.300", _dark: "brand.700" }}
          bg={{ base: "brand.50", _dark: "brand.950" }}
          color="brand.fg"
          fontSize="sm"
          fontWeight="semibold"
          cursor="pointer"
          transition="all 0.15s"
          _hover={{
            borderColor: "brand.400",
            bg: { base: "brand.100", _dark: "brand.900" },
          }}
        >
          <LuPlus size={16} />
          <Text as="span">Add playoff match</Text>
        </Box>
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

interface SidePickerProps {
  ariaLabel: string;
  slot: PlayoffSlot;
  qualifiers: number;
  others: PlayoffMatchSpec[];
  onChange: (slot: PlayoffSlot) => void;
}

/** One side of a match as a single plain-language picker: tap to choose a table
 *  place, or the winner/loser of another match — all from one menu. */
function SidePicker({
  ariaLabel,
  slot,
  qualifiers,
  others,
  onChange,
}: SidePickerProps) {
  const seeds = Array.from({ length: qualifiers }, (_, i) => i + 1);
  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          aria-label={ariaLabel}
          w="full"
          minH="40px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          px={3}
          py={2}
          borderRadius="md"
          borderWidth={1}
          borderColor="input.border"
          bg="input.bg"
          color="fg.default"
          cursor="pointer"
          transition="all 0.12s"
          _hover={{ borderColor: "brand.300" }}
        >
          <Text fontSize="sm" fontWeight="medium" truncate>
            {slotLabel(slot, others)}
          </Text>
          <Box color="fg.muted" flexShrink={0} display="flex">
            <LuChevronDown size={14} />
          </Box>
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="210px" maxH="280px" overflowY="auto">
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>From the table</Menu.ItemGroupLabel>
              {seeds.map((s) => (
                <Menu.Item
                  key={`seed-${s}`}
                  value={`seed-${s}`}
                  onClick={() => onChange({ kind: "seed", seed: s })}
                >
                  {ordinal(s)} place
                </Menu.Item>
              ))}
            </Menu.ItemGroup>
            {others.length > 0 && (
              <>
                <Menu.Separator />
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel>From another match</Menu.ItemGroupLabel>
                  {others.map((m) => (
                    <Menu.Item
                      key={`win-${m.id}`}
                      value={`win-${m.id}`}
                      onClick={() => onChange({ kind: "winnerOf", matchId: m.id })}
                    >
                      Winner of {m.label || m.id}
                    </Menu.Item>
                  ))}
                  {others.map((m) => (
                    <Menu.Item
                      key={`lose-${m.id}`}
                      value={`lose-${m.id}`}
                      onClick={() => onChange({ kind: "loserOf", matchId: m.id })}
                    >
                      Loser of {m.label || m.id}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
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
  colorPalette = "brand",
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
