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
        p={4}
        bg="green.50"
        borderRadius="xl"
        border="2px solid"
        borderColor="green.200"
      >
        <VStack gap={2} align="center">
          <Text fontSize="md" fontWeight="700" color="green.700">
            Toss Complete
          </Text>
          <Text fontSize="sm" color="green.600" fontWeight="500">
            {match.toss.tossWinner} won and chose to {match.toss.decision} first
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack gap={3}>
      <Text fontSize="md" color="gray.700" fontWeight="600">
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
  const [tossWinner, setTossWinner] = useState<string>("");
  const [tossDecision, setTossDecision] = useState<TossDecision>("bat");
  const [flipComplete, setFlipComplete] = useState(false);

  const handleFlipCoin = () => {
    setIsFlipping(true);

    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      setFlipResult(result);
      setIsFlipping(false);

      const winner = result === team1Call ? match.team1 : match.team2;
      setTossWinner(winner);
      setFlipComplete(true);
    }, 1500);
  };

  const handleConfirmToss = () => {
    setMatchToss(match.id, tossWinner, tossDecision);
    setIsOpen(false);
    // Reset state
    setFlipComplete(false);
    setFlipResult(null);
    setIsFlipping(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button size="sm" width="full" colorPalette="blue">
          🪙 Flip Coin
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="380px"
            bg="white"
            borderRadius="xl"
            p={4}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            border="1px solid"
            borderColor="gray.200"
          >
            <Dialog.Header px={2} pb={3}>
              <VStack gap={1} w="full" align="center">
                <Text fontSize="lg" color="blue.600" fontWeight="500">
                  {match.team1} vs {match.team2}
                </Text>
              </VStack>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  position="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  color="gray.500"
                  _hover={{ color: "gray.700", bg: "gray.100" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={2}>
              <VStack gap={4} w="full">
                {/* Team Call Selection */}
                <Box w="full">
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="gray.700"
                    mb={2}
                    textAlign="center"
                  >
                    {match.team1} calls:
                  </Text>
                  <RadioCard.Root
                    value={team1Call}
                    onValueChange={(details) =>
                      setTeam1Call(details.value as "heads" | "tails")
                    }
                    colorPalette="blue"
                    disabled={isFlipping || flipComplete}
                  >
                    <HStack gap={3} justify="center">
                      <RadioCard.Item
                        value="heads"
                        w="100px"
                        h="40px"
                        border="2px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        bg="white"
                        _hover={{ cursor: "pointer" }}
                        _checked={{
                          borderColor: "blue.500",
                        }}
                        _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                      >
                        <RadioCard.ItemHiddenInput />
                        <RadioCard.ItemControl
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <RadioCard.ItemText
                            fontSize="sm"
                            fontWeight="500"
                            color="gray.700"
                          >
                            HEADS
                          </RadioCard.ItemText>
                        </RadioCard.ItemControl>
                      </RadioCard.Item>
                      <RadioCard.Item
                        value="tails"
                        w="100px"
                        h="40px"
                        border="2px solid"
                        borderColor="gray.200"
                        borderRadius="lg"
                        bg="white"
                        _hover={{ cursor: "pointer" }}
                        _checked={{
                          borderColor: "blue.500",
                        }}
                        _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                      >
                        <RadioCard.ItemHiddenInput />
                        <RadioCard.ItemControl
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <RadioCard.ItemText
                            fontSize="sm"
                            fontWeight="500"
                            color="gray.700"
                          >
                            TAILS
                          </RadioCard.ItemText>
                        </RadioCard.ItemControl>
                      </RadioCard.Item>
                    </HStack>
                  </RadioCard.Root>
                </Box>

                {/* Coin */}
                <CoinFlipping isFlipping={isFlipping} result={flipResult} />

                {/* Toss Decision Selection (shown after flip) */}
                {flipComplete && (
                  <Box w="full">
                    <Text
                      fontSize="sm"
                      fontWeight="500"
                      color="green.700"
                      mb={2}
                      textAlign="center"
                    >
                      {tossWinner} won and chooses to:
                    </Text>
                    <RadioCard.Root
                      value={tossDecision}
                      onValueChange={(details) =>
                        setTossDecision(details.value as TossDecision)
                      }
                      colorPalette="green"
                    >
                      <HStack gap={3} justify="center">
                        <RadioCard.Item
                          value="bat"
                          w="110px"
                          h="40px"
                          border="2px solid"
                          borderColor="gray.200"
                          borderRadius="lg"
                          bg="white"
                          _hover={{ cursor: "pointer" }}
                          _checked={{
                            borderColor: "green.500",
                          }}
                        >
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl
                            w="full"
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <RadioCard.ItemText
                              fontSize="sm"
                              fontWeight="500"
                              color="gray.700"
                            >
                              BAT FIRST
                            </RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                        <RadioCard.Item
                          value="bowl"
                          w="110px"
                          h="40px"
                          border="2px solid"
                          borderColor="gray.200"
                          borderRadius="lg"
                          bg="white"
                          _hover={{ cursor: "pointer" }}
                          _checked={{
                            borderColor: "green.500",
                          }}
                        >
                          <RadioCard.ItemHiddenInput />
                          <RadioCard.ItemControl
                            w="full"
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <RadioCard.ItemText
                              fontSize="sm"
                              fontWeight="500"
                              color="gray.700"
                            >
                              BOWL FIRST
                            </RadioCard.ItemText>
                          </RadioCard.ItemControl>
                        </RadioCard.Item>
                      </HStack>
                    </RadioCard.Root>
                  </Box>
                )}

                {/* Action Button */}
                {!flipComplete ? (
                  <Button
                    onClick={handleFlipCoin}
                    disabled={isFlipping}
                    size="md"
                    w="full"
                    h="44px"
                    color="white"
                    borderRadius="lg"
                    fontSize="sm"
                    fontWeight="500"
                    colorPalette="blue"
                  >
                    {isFlipping ? "Flipping..." : "Flip the Coin!"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirmToss}
                    size="md"
                    w="full"
                    h="44px"
                    color="white"
                    borderRadius="lg"
                    fontSize="sm"
                    colorPalette="green"
                    fontWeight="500"
                  >
                    Confirm Toss
                  </Button>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
