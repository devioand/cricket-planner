"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  VStack,
  Heading,
  Text,
  Dialog,
  Portal,
  CloseButton,
  HStack,
} from "@chakra-ui/react";
import { Button } from "@/components/ui/button";
import { TournamentSetupWizard } from "@/components/tournaments/setup-wizard/tournament-setup-wizard";
import { useTournament } from "@/contexts/tournament-context";

export default function RoundRobinSetup() {
  const tournament = useTournament();
  const router = useRouter();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const handleFinishTournament = () => {
    setShowFinishConfirm(true);
  };

  const confirmFinishTournament = () => {
    tournament.resetTournament();
    setShowFinishConfirm(false);
    router.push("/");
  };

  // If tournament is already generated, show finish option
  if (tournament.state.isGenerated) {
    return (
      <>
        <VStack gap={8} align="stretch" w="full" maxW="4xl" mx="auto" p={6}>
          <VStack align="stretch" gap={2}>
            <Heading size="xl" color="green.600">
              🏆 Tournament Active
            </Heading>
            <Text fontSize="md" color="gray.600">
              Your tournament is currently running. You can manage matches or
              finish the tournament.
            </Text>
          </VStack>

          <VStack gap={4}>
            <Button
              onClick={() => router.push("/tournament/round-robin/matches")}
              colorPalette="blue"
              size="lg"
              w="full"
              maxW="md"
            >
              📋 Manage Matches
            </Button>

            <Button
              onClick={() => router.push("/tournament/round-robin/standings")}
              colorPalette="purple"
              size="lg"
              w="full"
              maxW="md"
            >
              📊 View Standings
            </Button>

            <Button
              onClick={handleFinishTournament}
              colorPalette="red"
              variant="outline"
              size="lg"
              w="full"
              maxW="md"
            >
              🏁 Finish Tournament
            </Button>
          </VStack>
        </VStack>

        {/* Finish Tournament Confirmation Dialog */}
        <Dialog.Root
          open={showFinishConfirm}
          onOpenChange={(e) => !e.open && setShowFinishConfirm(false)}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content maxW="md" bg="white" borderRadius="lg" p={6}>
                <Dialog.Header>
                  <Dialog.Title color="red.600">
                    🏁 Finish Tournament
                  </Dialog.Title>
                  <CloseButton onClick={() => setShowFinishConfirm(false)} />
                </Dialog.Header>

                <Dialog.Body>
                  <VStack gap={4} align="stretch">
                    <Text fontSize="sm" textAlign="center" color="gray.700">
                      Are you sure you want to finish this tournament?
                    </Text>

                    <Text
                      fontSize="sm"
                      textAlign="center"
                      color="red.600"
                      fontWeight="medium"
                    >
                      This action cannot be undone.
                    </Text>

                    <HStack gap={3} w="full" pt={2}>
                      <Button
                        variant="outline"
                        flex="1"
                        onClick={() => setShowFinishConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        colorPalette="red"
                        flex="1"
                        onClick={confirmFinishTournament}
                      >
                        Yes, Finish Tournament
                      </Button>
                    </HStack>
                  </VStack>
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </>
    );
  }

  // Show setup wizard for new tournaments
  return (
    <VStack gap={6} align="stretch" w="full" minH="100vh" bg="gray.50" p={4}>
      <VStack align="stretch" gap={2} maxW="4xl" mx="auto" w="full">
        <Heading size="xl" color="blue.600" textAlign="center">
          🏏 Tournament Setup
        </Heading>
        <Text fontSize="md" color="gray.600" textAlign="center">
          Let's set up your cricket tournament step by step
        </Text>
      </VStack>

      <TournamentSetupWizard />
    </VStack>
  );
}
