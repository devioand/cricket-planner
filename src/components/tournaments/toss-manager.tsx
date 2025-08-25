"use client";

import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Dialog,
  Portal,
  CloseButton,
  RadioCard,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  useTournament,
  type Match,
  type TossDecision,
} from "@/contexts/tournament-context";
import { CoinFlipping } from "./coin-flipping";

interface TossManagerProps {
  match: Match;
}

export function TossManager({ match }: TossManagerProps) {
  if (match.toss) {
    return (
      <Box
        p={3}
        bg="green.50"
        borderRadius="md"
        border="1px solid"
        borderColor="green.200"
      >
        <VStack gap={2} align="center">
          <Text fontSize="sm" fontWeight="bold" color="green.700">
            ✅ Toss Complete
          </Text>
          <Text fontSize="xs" color="green.600">
            {match.toss.tossWinner} won and chose to {match.toss.decision}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack gap={2}>
      <Text fontSize="sm" color="gray.600">
        Toss Required
      </Text>
      <CoinFlipDialog match={match} />
    </VStack>
  );
}

interface CoinFlipDialogProps {
  match: Match;
}

function CoinFlipDialog({ match }: CoinFlipDialogProps) {
  const { setMatchToss } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<"heads" | "tails" | null>(null);
  const [team1Call, setTeam1Call] = useState<"heads" | "tails">("heads");
  const [showResult, setShowResult] = useState(false);
  const [tossWinner, setTossWinner] = useState<string>("");
  const [tossDecision, setTossDecision] = useState<TossDecision>("bat");

  const handleFlipCoin = () => {
    setIsFlipping(true);
    setShowResult(false);
    setFlipResult(null);

    // Add some suspense with sound effect simulation
    console.log("🪙 Coin toss initiated!");

    // Simulate realistic coin flip physics (1.5 seconds)
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      setFlipResult(result);
      setIsFlipping(false);

      // Determine winner
      const winner = result === team1Call ? match.team1 : match.team2;
      setTossWinner(winner);

      // Log the result for dramatic effect
      console.log(`🎯 Coin landed on: ${result.toUpperCase()}!`);
      console.log(`🏆 ${winner} wins the toss!`);

      setShowResult(true);
    }, 2000); // 1.5 second flip animation
  };

  const handleConfirmToss = () => {
    setMatchToss(match.id, tossWinner, tossDecision);
    setIsOpen(false);
    setShowResult(false);
    setFlipResult(null);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size="sm" colorScheme="blue">
          🪙 Flip Coin
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md" bg="white" borderRadius="lg" p={6}>
            <Dialog.Header>
              <VStack gap={2} w="full" align="center">
                <Text fontSize="xl" fontWeight="bold">
                  Cricket Toss
                </Text>
                <Text fontSize="md" color="blue.600">
                  {match.team1} vs {match.team2}
                </Text>
              </VStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton position="absolute" top={4} right={4} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={6} w="full">
                {/* Team Call Selection */}
                {!isFlipping && !showResult && (
                  <>
                    <RadioCard.Root
                      value={team1Call}
                      onValueChange={(details) =>
                        setTeam1Call(details.value as "heads" | "tails")
                      }
                      colorPalette="blue"
                      gap={3}
                    >
                      <RadioCard.Label fontSize="md" fontWeight="medium">
                        {match.team1} calls:
                      </RadioCard.Label>
                      <HStack gap={4} justify="center">
                        <RadioCard.Item value="heads" minW="120px">
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemText>👤 Heads</RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                        <RadioCard.Item value="tails" minW="120px">
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemText>⭐ Tails</RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                      </HStack>
                    </RadioCard.Root>

                    <CoinFlipping isFlipping={false} result={null} />

                    <Button
                      onClick={handleFlipCoin}
                      size="lg"
                      colorScheme="yellow"
                    >
                      <Text fontSize="lg" mr={2}>
                        🪙
                      </Text>
                      Flip the Coin!
                    </Button>
                  </>
                )}

                {/* Flipping Animation */}
                {isFlipping && (
                  <>
                    <CoinFlipping isFlipping={true} result={null} />
                    <VStack gap={2}>
                      <Text
                        fontSize="lg"
                        color="purple.600"
                        fontWeight="medium"
                      >
                        🌪️ Flipping in the air...
                      </Text>
                      <Text fontSize="sm" color="purple.500">
                        {match.team1} called &quot;{team1Call}&quot;
                      </Text>
                    </VStack>
                  </>
                )}

                {/* Result Display */}
                {showResult && (
                  <VStack gap={4} w="full">
                    <CoinFlipping isFlipping={false} result={flipResult} />

                    <RadioCard.Root
                      value={tossDecision}
                      onValueChange={(details) =>
                        setTossDecision(details.value as TossDecision)
                      }
                      colorPalette="green"
                      gap={3}
                    >
                      <RadioCard.Label fontSize="md" fontWeight="medium">
                        {tossWinner} won the toss and chooses to:
                      </RadioCard.Label>
                      <HStack gap={4} justify="center">
                        <RadioCard.Item value="bat" minW="130px">
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemText>
                              🏏 Bat First
                            </RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                        <RadioCard.Item value="bowl" minW="130px">
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl>
                            <RadioCard.ItemText>
                              ⚾ Bowl First
                            </RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                      </HStack>
                    </RadioCard.Root>

                    <Button
                      onClick={handleConfirmToss}
                      colorScheme="green"
                      size="lg"
                      w="full"
                    >
                      ✅ Confirm Toss
                    </Button>
                  </VStack>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
