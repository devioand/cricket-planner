"use client";

import { Badge, Box, Card, HStack, Text, VStack } from "@chakra-ui/react";
import type {
  PlayoffConfig,
  PlayoffSlot,
} from "@/contexts/tournament-context/types";

/** Group-stage / playoff / total match counts for a setup. */
export function matchCounts(
  teamCount: number,
  playoffConfig: PlayoffConfig | null,
): { group: number; playoffs: number; total: number } {
  // With exactly 2 teams there is no group stage — a single final.
  const group = teamCount >= 3 ? (teamCount * (teamCount - 1)) / 2 : 0;
  const playoffs =
    teamCount === 2 ? 1 : playoffConfig ? playoffConfig.matches.length : 0;
  return { group, playoffs, total: group + playoffs };
}

/** A titled card with an icon and optional trailing badge. */
export function SummaryCard({
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

export function StatTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Box
      flex="1"
      bg="bg.subtle"
      borderRadius="lg"
      px={3}
      py={2.5}
      textAlign="center"
    >
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

export function TeamChips({ teams }: { teams: string[] }) {
  return (
    <HStack gap={2} flexWrap="wrap">
      {teams.map((t) => (
        <Badge
          key={t}
          colorPalette="brand"
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
  );
}

/** A compact list of playoff matches with each side described in plain words. */
export function BracketPreview({ config }: { config: PlayoffConfig }) {
  const labelById: Record<string, string> = {};
  for (const m of config.matches) labelById[m.id] = m.label;

  return (
    <VStack align="stretch" gap={2}>
      {config.matches.map((m) => (
        <HStack
          key={m.id}
          gap={3}
          align="center"
          bg={
            m.isFinal ? { base: "yellow.50", _dark: "yellow.950" } : "bg.subtle"
          }
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

/** Big total + group/playoff breakdown, shown at the top of a setup review. */
export function MatchCountBanner({
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
      borderColor={{ base: "brand.200", _dark: "brand.800" }}
      bg={{ base: "brand.50", _dark: "brand.950" }}
    >
      <Card.Body p={4}>
        <HStack justify="space-between" align="center" gap={3}>
          <HStack gap={3} align="center">
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="fg.default"
              lineHeight="1"
            >
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
