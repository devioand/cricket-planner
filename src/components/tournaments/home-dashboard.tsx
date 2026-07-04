"use client";

import { Box, Heading, Text, VStack, HStack } from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { CreateTournamentDialog } from "@/components/tournaments/create-tournament-dialog";
import type { TournamentSummary } from "@/lib/repositories/tournament-repository";

export function HomeDashboard({
  tournaments,
}: {
  tournaments: TournamentSummary[];
}) {
  const [createOpen, setCreateOpen] = useState(false);

  // "Ongoing" = anything not finished (still being set up or in progress).
  const ongoing = tournaments.filter((t) => t.status !== "completed");
  const completedCount = tournaments.length - ongoing.length;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="900px" mx="auto" w="full">
      {ongoing.length > 0 ? (
        <VStack gap={6} align="stretch">
          <HStack
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Heading size={{ base: "lg", md: "xl" }}>
                Continue playing
              </Heading>
              <Text fontSize="sm" color="fg.muted" mt={1}>
                Pick up one of your ongoing tournaments.
              </Text>
            </Box>
            <Button colorPalette="blue" onClick={() => setCreateOpen(true)}>
              <HStack gap={2}>
                <LuPlus />
                <Text>New Tournament</Text>
              </HStack>
            </Button>
          </HStack>

          <VStack gap={3} align="stretch">
            {ongoing.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </VStack>

          <Box textAlign="center" pt={2}>
            <Link href="/tournaments">
              <Button variant="ghost" colorPalette="blue">
                View all tournaments
                {completedCount > 0 ? ` (${tournaments.length})` : ""} →
              </Button>
            </Link>
          </Box>
        </VStack>
      ) : (
        <EmptyHero
          hasCompleted={completedCount > 0}
          onCreate={() => setCreateOpen(true)}
        />
      )}

      <CreateTournamentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </Box>
  );
}

function EmptyHero({
  hasCompleted,
  onCreate,
}: {
  hasCompleted: boolean;
  onCreate: () => void;
}) {
  return (
    <Box
      minH="calc(100vh - 200px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={6} textAlign="center" maxW="lg">
        <Box
          fontSize={{ base: "5xl", md: "6xl" }}
          role="img"
          aria-label="cricket"
        >
          🏏
        </Box>
        <VStack gap={2}>
          <Heading size={{ base: "lg", md: "xl" }}>
            Start your first tournament
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="md">
            Create a cricket tournament, add your teams, and track every match,
            toss, and the final standings — all in one place.
          </Text>
        </VStack>

        <Button size="lg" colorPalette="blue" onClick={onCreate}>
          <HStack gap={2}>
            <LuPlus />
            <Text>New Tournament</Text>
          </HStack>
        </Button>

        {hasCompleted && (
          <Link href="/tournaments">
            <Button variant="ghost" colorPalette="blue">
              View past tournaments →
            </Button>
          </Link>
        )}
      </VStack>
    </Box>
  );
}
