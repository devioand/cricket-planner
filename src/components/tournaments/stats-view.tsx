"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuShare2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { ShareStatsDialog } from "@/components/tournaments/share-stats-dialog";
import {
  computeTournamentInsights,
  type Award,
  type Highlight,
  type Standout,
} from "@/contexts/tournament-context/algorithms/insights";

/** Fun, energetic tournament analytics — the big numbers, highlights, and awards. */
export function StatsView() {
  const { state, hydrating, store } = useLiveTournament();
  const [shareOpen, setShareOpen] = useState(false);
  if (hydrating) return null;

  const insights = computeTournamentInsights(state);

  if (!insights.hasData) {
    return (
      <Box p={10} bg="bg.subtle" borderRadius="xl" textAlign="center">
        <Text fontSize="4xl" mb={2}>
          📊
        </Text>
        <Heading size="md" mb={1}>
          No stats yet
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Play a few matches and the highlights, awards, and power rankings will
          light up here.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={7}>
      <Button
        variant="outline"
        colorPalette="brand"
        size="md"
        w="full"
        onClick={() => setShareOpen(true)}
      >
        <LuShare2 /> Share stats
      </Button>

      <ShareStatsDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        name={store.name}
      />

      {insights.champion ? (
        <ChampionHero champion={insights.champion} />
      ) : (
        insights.standout && <LeaderHero standout={insights.standout} />
      )}
      {insights.awards.length > 0 && (
        <Section title="Tournament awards" emoji="⭐">
          <VStack align="stretch" gap={3}>
            {insights.standout && <AwardsLeader standout={insights.standout} />}
            <SimpleGrid columns={2} gap={3}>
              {insights.awards.map((a) => (
                <AwardCard key={a.key} award={a} />
              ))}
            </SimpleGrid>
          </VStack>
        </Section>
      )}
      {insights.highlights.length > 0 && (
        <Section title="Match highlights" emoji="🎬">
          <SimpleGrid columns={2} gap={3}>
            {insights.highlights.map((h) => (
              <HighlightCard key={h.key} highlight={h} />
            ))}
          </SimpleGrid>
        </Section>
      )}
    </VStack>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function ChampionHero({ champion }: { champion: string }) {
  return (
    <Box
      bg={{ base: "yellow.50", _dark: "yellow.950" }}
      borderWidth={1}
      borderColor="yellow.400"
      borderRadius="2xl"
      px={5}
      py={7}
      textAlign="center"
    >
      <Text fontSize="5xl" lineHeight="1" mb={1}>
        🏆
      </Text>
      <Text
        fontSize="2xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="widest"
        color={{ base: "yellow.700", _dark: "yellow.300" }}
      >
        Champions
      </Text>
      <Heading size="xl" mt={1} color="fg.default">
        {champion}
      </Heading>
      <Badge colorPalette="yellow" variant="subtle" mt={2} borderRadius="full" px={3} py={1}>
        🎉 Tournament winner
      </Badge>
    </Box>
  );
}

/** Shown while the tournament is still live — who's setting the pace. */
function LeaderHero({ standout }: { standout: Standout }) {
  return (
    <Box
      bg={{ base: "purple.50", _dark: "purple.950" }}
      borderWidth={1}
      borderColor="purple.400"
      borderRadius="2xl"
      px={5}
      py={6}
      textAlign="center"
    >
      <Text fontSize="4xl" lineHeight="1" mb={1}>
        🌟
      </Text>
      <Text
        fontSize="2xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="widest"
        color={{ base: "purple.600", _dark: "purple.300" }}
      >
        Team to beat
      </Text>
      <Heading size="lg" mt={1} color="fg.default">
        {standout.team}
      </Heading>
      <Badge colorPalette="purple" variant="subtle" mt={2} borderRadius="full" px={3} py={1}>
        Leading {standout.awardCount} of {standout.totalAwards} awards
      </Badge>
    </Box>
  );
}

// ── Match highlights ──────────────────────────────────────────────────────────

const HIGHLIGHT_COLOR: Record<string, string> = {
  highest: "purple",
  biggest: "red",
  closest: "orange",
  statement: "brand",
};

function HighlightCard({ highlight: h }: { highlight: Highlight }) {
  const c = HIGHLIGHT_COLOR[h.key] ?? "brand";
  return (
    <VStack
      bg="card.bg"
      borderWidth={1}
      borderColor="card.border"
      borderRadius="xl"
      p={3}
      gap={1}
      align="center"
      textAlign="center"
    >
      <Box
        boxSize="40px"
        fontSize="xl"
        borderRadius="full"
        bg={{ base: `${c}.100`, _dark: `${c}.900` }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={0.5}
      >
        {h.emoji}
      </Box>
      <Text fontSize="xs" color="fg.muted" lineHeight="1.2">
        {h.title}
      </Text>
      <Text fontWeight="bold" fontSize="lg" color="fg.default" lineHeight="1.25">
        {h.headline}
      </Text>
      {h.detail && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={{ base: `${c}.600`, _dark: `${c}.300` }}
        >
          {h.detail}
        </Text>
      )}
    </VStack>
  );
}

// ── Awards ────────────────────────────────────────────────────────────────────

const AWARD_COLOR: Record<string, string> = {
  nrr: "brand",
  batting: "green",
  bowling: "teal",
  wins: "yellow",
};

/** A compact champion-style card leading the awards — the most-decorated team. */
function AwardsLeader({ standout }: { standout: Standout }) {
  const swept = standout.awardCount === standout.totalAwards;
  return (
    <Box
      bg={{ base: "purple.50", _dark: "purple.950" }}
      borderWidth={1}
      borderColor="purple.400"
      borderRadius="2xl"
      px={5}
      py={4}
      textAlign="center"
    >
      <Text fontSize="2xl" lineHeight="1">
        🌟
      </Text>
      <Text
        fontSize="2xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="widest"
        color={{ base: "purple.600", _dark: "purple.300" }}
      >
        Most Decorated
      </Text>
      <Heading size="md" mt={0.5} color="fg.default">
        {standout.team}
      </Heading>
      <Badge colorPalette="purple" variant="subtle" mt={1.5} borderRadius="full" px={3}>
        {swept
          ? `Clean sweep · all ${standout.totalAwards} awards`
          : `${standout.awardCount} of ${standout.totalAwards} awards`}
      </Badge>
    </Box>
  );
}

function AwardCard({ award: a }: { award: Award }) {
  const c = AWARD_COLOR[a.key] ?? "brand";
  return (
    <VStack
      bg="card.bg"
      borderWidth={1}
      borderColor="card.border"
      borderRadius="xl"
      p={3}
      gap={1}
      align="center"
      textAlign="center"
    >
      <Box
        boxSize="40px"
        fontSize="xl"
        borderRadius="full"
        bg={{ base: `${c}.100`, _dark: `${c}.900` }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={0.5}
      >
        {a.emoji}
      </Box>
      <Text fontSize="xs" color="fg.muted" lineHeight="1.2">
        {a.title}
      </Text>
      <Text
        fontWeight="bold"
        fontSize="lg"
        color="fg.default"
        lineHeight="1.2"
        truncate
        maxW="full"
      >
        {a.team}
      </Text>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color={{ base: `${c}.600`, _dark: `${c}.300` }}
      >
        {a.metric}
      </Text>
    </VStack>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Section({
  title,
  emoji,
  note,
  children,
}: {
  title: string;
  emoji: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <VStack align="stretch" gap={3}>
      <Box>
        <HStack gap={2} align="center">
          <Text fontSize="lg" lineHeight="1">
            {emoji}
          </Text>
          <Heading size="sm">{title}</Heading>
        </HStack>
        {note && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {note}
          </Text>
        )}
      </Box>
      {children}
    </VStack>
  );
}
