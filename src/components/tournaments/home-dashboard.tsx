"use client";

import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { LuPlay, LuSwords } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import type { TournamentSummary } from "@/lib/repositories/tournament-repository";

export function HomeDashboard({
  tournaments,
}: {
  tournaments: TournamentSummary[];
}) {
  // Upcoming = scheduled for a future day, not started. Continue = everything
  // else you're mid-way through. Completed drops to History.
  const now = Date.now();
  const upcoming = tournaments
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.scheduledStart &&
        new Date(t.scheduledStart).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledStart as string).getTime() -
        new Date(b.scheduledStart as string).getTime(),
    );
  const upcomingIds = new Set(upcoming.map((t) => t.id));
  const ongoing = tournaments.filter(
    (t) => t.status !== "completed" && !upcomingIds.has(t.id),
  );
  const completedCount = tournaments.filter(
    (t) => t.status === "completed",
  ).length;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack gap={6} align="stretch">
        {/* The front door: play now, or the belt format. */}
        <VStack gap={3} align="stretch">
          <StartPlaying />
          <Link href="/belt/new" style={{ textDecoration: "none" }}>
            <Button variant="outline" colorPalette="brand" w="full" size="lg">
              <HStack gap={2}>
                <LuSwords />
                <Text>Hold the Belt</Text>
              </HStack>
            </Button>
          </Link>
        </VStack>

        {upcoming.length > 0 && (
          <VStack gap={3} align="stretch">
            <SectionLabel>Upcoming</SectionLabel>
            {upcoming.map((t) => (
              <UpcomingCard key={t.id} tournament={t} />
            ))}
          </VStack>
        )}

        {ongoing.length > 0 && (
          <VStack gap={3} align="stretch">
            <SectionLabel>Continue</SectionLabel>
            {ongoing.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </VStack>
        )}

        {completedCount > 0 && (
          <Link href="/tournaments" style={{ textDecoration: "none" }}>
            <Button variant="ghost" colorPalette="brand" w="full">
              View history ({tournaments.length}) →
            </Button>
          </Link>
        )}

        {tournaments.length === 0 && (
          <Box textAlign="center" color="fg.muted" pt={2}>
            <Text fontSize="sm">
              Tap <Text as="span" color="fg.default" fontWeight="medium">Start playing</Text>{" "}
              — pick who&apos;s here, choose a format, and go.
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

/** The primary action — a solid maroon hero that opens the setup flow. */
function StartPlaying() {
  return (
    <Link href="/tournaments/new" style={{ textDecoration: "none" }}>
      <Box
        bg="brand.500"
        color="white"
        borderRadius="2xl"
        p={5}
        display="flex"
        alignItems="center"
        gap={4}
        cursor="pointer"
        transition="transform 0.1s, background 0.15s"
        _hover={{ bg: "brand.600" }}
        _active={{ transform: "scale(0.99)" }}
        boxShadow="0 12px 24px -14px var(--colors-brand-500)"
      >
        <Box
          w="48px"
          h="48px"
          borderRadius="xl"
          bg="whiteAlpha.300"
          display="grid"
          placeItems="center"
          flexShrink={0}
        >
          <LuPlay size={22} fill="white" strokeWidth={0} />
        </Box>
        <Box>
          <Heading size="md" fontFamily="heading" lineHeight="1.1">
            Start playing
          </Heading>
          <Text fontSize="sm" opacity={0.85} mt={0.5}>
            Set up a game and score it live
          </Text>
        </Box>
      </Box>
    </Link>
  );
}

/** A scheduled game waiting for its day — date on the left, Start on the right. */
function UpcomingCard({ tournament: t }: { tournament: TournamentSummary }) {
  const when = new Date(t.scheduledStart as string);
  const day = when.getDate();
  const weekday = when.toLocaleDateString(undefined, { weekday: "short" });
  const time = when.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const href = `/tournament/round-robin/${t.id}/matches`;

  return (
    <HStack
      gap={3}
      borderWidth="1px"
      borderColor="card.border"
      bg="card.bg"
      borderRadius="xl"
      p={3}
    >
      <VStack gap={0} flexShrink={0} w="46px" textAlign="center">
        <Text
          fontFamily="heading"
          fontWeight="bold"
          fontSize="xl"
          lineHeight="1"
          color="brand.fg"
        >
          {day}
        </Text>
        <Text
          fontFamily="mono"
          fontSize="9px"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="fg.subtle"
        >
          {weekday}
        </Text>
      </VStack>
      <Box flex="1" minW={0}>
        <Text fontWeight="semibold" fontSize="sm" color="fg.default" truncate>
          {t.name}
        </Text>
        <Text fontSize="xs" color="fg.muted" truncate>
          {t.teamCount} {t.teamCount === 1 ? "team" : "teams"} · {time}
        </Text>
      </Box>
      <Link href={href} style={{ textDecoration: "none" }}>
        <Button variant="outline" colorPalette="brand" size="sm">
          Start
        </Button>
      </Link>
    </HStack>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="xs"
      fontWeight="medium"
      letterSpacing="0.1em"
      textTransform="uppercase"
      color="fg.subtle"
    >
      {children}
    </Text>
  );
}
