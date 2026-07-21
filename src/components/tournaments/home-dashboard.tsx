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
  // "Ongoing" = anything not finished (still being set up or in progress).
  const ongoing = tournaments.filter((t) => t.status !== "completed");
  const completedCount = tournaments.length - ongoing.length;

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
