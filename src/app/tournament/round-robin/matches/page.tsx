"use client";

import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useTournament } from "@/contexts/tournament-context";
import { MatchManager } from "@/components/tournaments/match-manager";
import { PlayoffManager } from "@/components/tournaments/playoff-manager";
import { RoundRobinNavigation } from "@/components/tournaments/round-robin-navigation";

export default function RoundRobinMatches() {
  const tournament = useTournament();
  const router = useRouter();

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto" w="full">
      {/* Navigation */}
      <RoundRobinNavigation />

      {/* Header */}
      <VStack gap={4} align="stretch" mb={8}>
        <Box textAlign="center">
          <Heading size={{ base: "lg", md: "xl" }} color="blue.600" mb={2}>
            ⚽ Tournament Matches
          </Heading>
          <Text
            color="gray.600"
            fontSize={{ base: "sm", md: "md" }}
            maxW="2xl"
            mx="auto"
          >
            Manage match results and playoff progression
          </Text>
        </Box>
      </VStack>

      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        {!tournament.state.isGenerated ? (
          <Box p={8} bg="blue.50" rounded="lg" textAlign="center">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="semibold"
              color="blue.700"
              mb={4}
            >
              📋 No Tournament Generated
            </Text>
            <Text fontSize="md" color="blue.600" mb={6}>
              Please set up your tournament first by adding teams and generating
              matches
            </Text>
            <Button
              onClick={() => router.push("/tournament/round-robin/setup")}
              colorScheme="blue"
              size="lg"
            >
              ← Go to Setup
            </Button>
          </Box>
        ) : (
          <>
            {/* Playoff Manager */}
            <PlayoffManager />

            {/* Match Manager */}
            <MatchManager />
          </>
        )}
      </VStack>
    </Box>
  );
}
