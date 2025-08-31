"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Box,
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
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay content appearance for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      triggerElegantCelebration();
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const triggerElegantCelebration = () => {
    // Sophisticated confetti with elegant colors
    const elegantColors = [
      "#C9A961", // Champagne gold
      "#E6D7C0", // Warm ivory
      "#F4E7D1", // Cream
      "#B8860B", // Dark goldenrod
      "#DAA520", // Goldenrod
    ];

    // Initial gentle burst
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7, x: 0.2 },
      colors: elegantColors,
      gravity: 0.8,
      drift: 0.1,
      zIndex: 2000,
    });

    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.7, x: 0.8 },
      colors: elegantColors,
      gravity: 0.8,
      drift: -0.1,
      zIndex: 2000,
    });

    // Cascade effect
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.3 },
        colors: elegantColors,
        shapes: ["circle"],
        gravity: 0.6,
        scalar: 0.8,
        zIndex: 2000,
      });
    }, 600);
  };

  const triggerMoreCelebration = () => {
    // Premium celebration effect
    const premiumColors = ["#C9A961", "#E6D7C0", "#DAA520"];

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: premiumColors,
      shapes: ["star", "circle"],
      gravity: 0.7,
      scalar: 1.2,
      zIndex: 2000,
    });
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="md"
      placement="center"
      closeOnInteractOutside={false}
      motionPreset="slide-in-bottom"
    >
      <Portal>
        {/* Sophisticated backdrop */}
        <Dialog.Backdrop
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
          style={{
            background:
              "radial-gradient(circle at center, rgba(201, 169, 97, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)",
          }}
        />
        <Dialog.Positioner>
          <Dialog.Content
            bg="white"
            border="1px solid"
            borderColor="gray.100"
            borderRadius="2xl"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            position="relative"
            overflow="hidden"
            maxW="400px"
            p={0}
            transform={showContent ? "scale(1)" : "scale(0.9)"}
            opacity={showContent ? 1 : 0}
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            {/* Elegant gradient overlay */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="120px"
              bgGradient="linear(to-b, rgba(201, 169, 97, 0.08), transparent)"
              pointerEvents="none"
            />

            {/* Minimalist close button */}
            <Dialog.CloseTrigger
              asChild
              position="absolute"
              top={4}
              right={4}
              zIndex={10}
            >
              <CloseButton
                size="sm"
                variant="ghost"
                color="gray.500"
                _hover={{
                  bg: "gray.100",
                  color: "gray.700",
                }}
              />
            </Dialog.CloseTrigger>

            <VStack gap={0} align="center" position="relative" zIndex={1}>
              {/* Modern trophy icon */}
              <Box pt={12} pb={4}>
                <Box
                  w="80px"
                  h="80px"
                  bg="linear-gradient(135deg, #C9A961 0%, #E6D7C0 100%)"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 8px 32px rgba(201, 169, 97, 0.3)"
                  position="relative"
                  _before={{
                    content: '""',
                    position: "absolute",
                    inset: "2px",
                    borderRadius: "full",
                    padding: "2px",
                    background:
                      "linear-gradient(135deg, transparent, rgba(255,255,255,0.3))",
                    WebkitMask:
                      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "exclude",
                  }}
                >
                  <Text
                    fontSize="2xl"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  >
                    🏆
                  </Text>
                </Box>
              </Box>

              {/* Clean typography */}
              <VStack gap={3} pb={8} px={8}>
                <Text
                  fontSize="sm"
                  fontWeight="500"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Tournament Winner
                </Text>

                <Heading
                  size="xl"
                  color="gray.900"
                  textAlign="center"
                  fontWeight="600"
                  letterSpacing="-0.025em"
                >
                  {winner}
                </Heading>

                <Text
                  fontSize="md"
                  color="gray.600"
                  textAlign="center"
                  fontWeight="400"
                >
                  Congratulations on your victory
                </Text>
              </VStack>

              {/* Modern button design */}
              <HStack gap={3} pb={8} px={8} w="full">
                <Button
                  flex="1"
                  size="md"
                  h="44px"
                  bg="linear-gradient(135deg, #C9A961 0%, #DAA520 100%)"
                  color="white"
                  borderRadius="lg"
                  fontSize="sm"
                  fontWeight="500"
                  _hover={{
                    bg: "linear-gradient(135deg, #B8860B 0%, #C9A961 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(201, 169, 97, 0.4)",
                  }}
                  _active={{ transform: "translateY(0)" }}
                  transition="all 0.2s"
                  onClick={triggerMoreCelebration}
                >
                  Celebrate
                </Button>

                <Button
                  flex="1"
                  size="md"
                  h="44px"
                  variant="ghost"
                  color="gray.600"
                  borderRadius="lg"
                  fontSize="sm"
                  fontWeight="500"
                  _hover={{
                    bg: "gray.50",
                    color: "gray.900",
                  }}
                  onClick={onClose}
                >
                  Continue
                </Button>
              </HStack>
            </VStack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
