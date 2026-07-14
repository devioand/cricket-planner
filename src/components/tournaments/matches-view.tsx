"use client";

import Link from "next/link";
import { useState } from "react";
import { Text, VStack, Box, HStack, Skeleton } from "@chakra-ui/react";
import { LuShare2 } from "react-icons/lu";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { MatchCard } from "@/components/tournaments/match-card";
import { SampleResultsButton } from "@/components/tournaments/sample-results-button";
import { FinishBanner } from "@/components/tournaments/finish-banner";
import { ShareFixtureDialog } from "@/components/tournaments/share-fixture-dialog";
import { Button } from "@/components/ui/button";

/**
 * Matches tab — reads the live tournament from the local store, so every
 * scoring action reflects instantly without a server round-trip.
 */
export function MatchesView() {
  const { state, readOnly, hydrating, store } = useLiveTournament();
  const [shareOpen, setShareOpen] = useState(false);

  // On a hard reload the server can't read localStorage; show a skeleton until
  // the client reveals the real state (instead of flashing stale DB data).
  if (hydrating) return <MatchesSkeleton />;

  if (!state.isGenerated) {
    return (
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        <Box p={8} bg="bg.subtle" rounded="lg" textAlign="center">
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="semibold"
            color="fg.default"
            mb={4}
          >
            📋 Nothing to show yet
          </Text>
          <Text fontSize="md" color="fg.muted" mb={6}>
            This tournament isn&apos;t available on this device. It may not have
            been synced yet — open it on the device where you created it.
          </Text>
          <Link href="/tournaments">
            <Button colorPalette="blue" size="lg">
              ← Back to tournaments
            </Button>
          </Link>
        </Box>
      </VStack>
    );
  }

  const roundRobinMatches = state.matches
    .filter((m) => !m.isPlayoff)
    .sort((a, b) => a.round - b.round);
  const playoffMatches = state.matches
    .filter((m) => m.isPlayoff)
    .sort((a, b) => a.round - b.round);
  const pending = state.matches.filter((m) => m.status !== "completed").length;

  return (
    <VStack align="stretch" gap={6}>
      <FinishBanner />

      <Button
        variant="outline"
        colorPalette="green"
        size="md"
        w="full"
        onClick={() => setShareOpen(true)}
      >
        <LuShare2 /> Share fixtures
      </Button>

      <ShareFixtureDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        name={store.name}
      />

      {process.env.NODE_ENV === "development" && !readOnly && pending > 0 && (
        <SampleResultsButton pending={pending} />
      )}

      {/* Group stage */}
      {roundRobinMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          {playoffMatches.length > 0 && <SectionDivider label="Group Stage" />}
          {roundRobinMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              matchNumber={index + 1}
              totalMatches={roundRobinMatches.length}
              readOnly={readOnly}
            />
          ))}
        </VStack>
      )}

      {/* Playoffs — a slim divider instead of a heading block. */}
      {playoffMatches.length > 0 && (
        <VStack align="stretch" gap={4}>
          <SectionDivider label="Playoffs" />
          {playoffMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              matchNumber={index + 1}
              totalMatches={playoffMatches.length}
              isPlayoff
              readOnly={readOnly}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

/** A slim labeled separator between match sections. */
function SectionDivider({ label }: { label: string }) {
  return (
    <HStack gap={3} align="center" pt={1}>
      <Box flex="1" h="1px" bg="border.default" />
      <Text
        fontSize="2xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wider"
        flexShrink={0}
      >
        {label}
      </Text>
      <Box flex="1" h="1px" bg="border.default" />
    </HStack>
  );
}

/** Placeholder shown while the client reads the tournament from localStorage. */
function MatchesSkeleton() {
  return (
    <VStack align="stretch" gap={4} aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          p={4}
          bg="card.bg"
          borderRadius="lg"
          borderWidth={2}
          borderColor="border.default"
        >
          <VStack align="stretch" gap={3}>
            <Skeleton height="14px" width="110px" alignSelf="center" />
            <HStack justify="space-between">
              <Skeleton height="16px" width="90px" />
              <Skeleton height="16px" width="70px" />
            </HStack>
            <HStack justify="space-between">
              <Skeleton height="16px" width="90px" />
              <Skeleton height="16px" width="70px" />
            </HStack>
            <Skeleton height="12px" width="55%" alignSelf="center" />
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}
