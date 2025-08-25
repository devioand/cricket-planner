"use client";

import { useEffect } from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  VStack,
  Heading,
  Text,
  Button,
  Badge,
  HStack,
} from "@chakra-ui/react";
import confetti from "canvas-confetti";

interface TournamentCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  winner: string;
}

export function TournamentCelebration({
  isOpen,
  onClose,
  winner,
}: TournamentCelebrationProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger celebration animations
      triggerCelebration();
    }
  }, [isOpen]);

  const triggerCelebration = () => {
    // Multiple confetti bursts for epic celebration
    const duration = 3000;
    const end = Date.now() + duration;

    // First burst - colorful confetti from both sides
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.1 },
      colors: ["#FFD700", "#FF6347", "#32CD32", "#1E90FF", "#FF69B4"],
      zIndex: 2000, // Higher than dialog z-index
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.9 },
      colors: ["#FFD700", "#FF6347", "#32CD32", "#1E90FF", "#FF69B4"],
      zIndex: 2000, // Higher than dialog z-index
    });

    // Continuous celebration
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      // Random bursts
      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          y: Math.random() * 0.3 + 0.4,
          x: Math.random() * 0.6 + 0.2,
        },
        colors: ["#FFD700", "#FFA500", "#FF6347"],
        zIndex: 2000, // Higher than dialog z-index
      });
    }, 200);

    // Trophy-colored golden confetti shower
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.2 },
        colors: ["#FFD700", "#FFA500", "#FFFF00"],
        shapes: ["circle", "square"],
        zIndex: 2000, // Higher than dialog z-index
      });
    }, 500);

    // Final big burst
    setTimeout(() => {
      confetti({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.5 },
        colors: [
          "#FFD700",
          "#FF6347",
          "#32CD32",
          "#1E90FF",
          "#FF69B4",
          "#FFA500",
        ],
        zIndex: 2000, // Higher than dialog z-index
      });
    }, 1500);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="xl"
      placement="center"
      closeOnInteractOutside={false}
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.300" backdropFilter="blur(5px)" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="gradient(to-br, yellow.50, orange.50)"
            border="3px solid"
            borderColor="yellow.400"
            borderRadius="xl"
            boxShadow="2xl"
            position="relative"
            overflow="hidden"
          >
            {/* Animated background gradient */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(45deg, #FFD700, #FFA500, #FF6347, #FFD700)",
                backgroundSize: "400% 400%",
                animation: "gradient 3s ease infinite",
                opacity: 0.1,
                zIndex: 0,
              }}
            />

            <style jsx>{`
              @keyframes gradient {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
            `}</style>

            <Dialog.Header position="relative" zIndex={1} textAlign="center">
              <VStack gap={3} align="center" w="full" mt={6}>
                <Text fontSize="6xl" role="img" aria-label="trophy">
                  🏆
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.CloseTrigger
              asChild
              position="absolute"
              top={4}
              right={4}
              zIndex={1}
            >
              <CloseButton size="md" />
            </Dialog.CloseTrigger>

            <Dialog.Body pb={8} position="relative" zIndex={1}>
              <VStack gap={6} align="center">
                {/* Winner Announcement */}
                <VStack gap={3}>
                  <Badge
                    colorScheme="yellow"
                    fontSize="lg"
                    px={4}
                    py={2}
                    borderRadius="full"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    fontWeight="bold"
                  >
                    🎉 Champion 🎉
                  </Badge>

                  <Heading
                    size="2xl"
                    color="yellow.600"
                    textAlign="center"
                    textShadow="2px 2px 4px rgba(0,0,0,0.2)"
                    style={{
                      background: "linear-gradient(45deg, #FFD700, #FFA500)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {winner}
                  </Heading>

                  <Text
                    fontSize="lg"
                    color="gray.600"
                    textAlign="center"
                    fontWeight="medium"
                  >
                    Wins the Tournament!
                  </Text>
                </VStack>

                {/* Celebration Message */}
                <Text fontSize="md" color="gray.700" textAlign="center">
                  🎊 Congratulations! 🎊
                </Text>

                {/* Action Buttons */}
                <HStack gap={4} pt={4}>
                  <Button
                    colorScheme="yellow"
                    size="lg"
                    onClick={() => {
                      // More celebration with proper z-index
                      confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: [
                          "#FFD700",
                          "#FFA500",
                          "#FF6347",
                          "#32CD32",
                          "#1E90FF",
                        ],
                        zIndex: 2000,
                      });
                    }}
                  >
                    🎉 More Celebration!
                  </Button>

                  <Button
                    colorScheme="blue"
                    variant="outline"
                    size="lg"
                    onClick={onClose}
                  >
                    Continue
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
