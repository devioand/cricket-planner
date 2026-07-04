"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Flex,
  Input,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { createTournamentAction } from "@/app/tournaments/actions";
import type { TournamentType } from "@/contexts/tournament-context/types";

interface TournamentAlgorithm {
  id: TournamentType;
  name: string;
  description: string;
  features: string[];
  isAvailable: boolean;
  icon: string;
  color: string;
  estimatedTime: string;
  bestFor: string;
}

const algorithms: TournamentAlgorithm[] = [
  {
    id: "round-robin",
    name: "Round Robin",
    description:
      "Every team plays every other team once. Most fair and comprehensive format.",
    features: [
      "Every team plays every other team",
      "Most accurate standings",
      "Fair for all participants",
      "Complete statistical analysis",
    ],
    isAvailable: true,
    icon: "🔄",
    color: "blue",
    estimatedTime: "Long duration",
    bestFor: "League tournaments, fair competition",
  },
  {
    id: "single-elimination",
    name: "Single Elimination",
    description:
      "Knockout format where one loss eliminates a team. Fast and exciting.",
    features: [
      "One loss and you're out",
      "Quick tournament completion",
      "High stakes matches",
      "Traditional bracket format",
    ],
    isAvailable: false,
    icon: "⚡",
    color: "red",
    estimatedTime: "Short duration",
    bestFor: "Quick tournaments, knockout cups",
  },
  {
    id: "double-elimination",
    name: "Double Elimination",
    description:
      "Teams get a second chance in the losers bracket. Balanced excitement.",
    features: [
      "Winner and loser brackets",
      "Second chance for teams",
      "More matches than single elimination",
      "Fairer than single knockout",
    ],
    isAvailable: false,
    icon: "🔥",
    color: "orange",
    estimatedTime: "Medium duration",
    bestFor: "Competitive tournaments, esports",
  },
  {
    id: "triple-elimination",
    name: "Triple Elimination",
    description:
      "Extended format with multiple chances. Maximum fairness with excitement.",
    features: [
      "Three chances for each team",
      "Multiple bracket system",
      "Extended tournament format",
      "Ultimate fairness",
    ],
    isAvailable: false,
    icon: "🏆",
    color: "purple",
    estimatedTime: "Extended duration",
    bestFor: "Championship series, major tournaments",
  },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<TournamentAlgorithm | null>(null);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const openCreateDialog = (algorithm: TournamentAlgorithm) => {
    setSelected(algorithm);
    setName("");
  };

  const closeCreateDialog = () => {
    if (isCreating) return;
    setSelected(null);
    setName("");
  };

  const handleCreate = async () => {
    if (!selected || !name.trim()) return;
    setIsCreating(true);
    try {
      const { id } = await createTournamentAction({
        name: name.trim(),
        algorithm: selected.id,
        playoffFormat: "world-cup",
        maxOvers: 20,
        maxWickets: 10,
      });
      router.push(`/tournament/round-robin/${id}/setup`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
      setIsCreating(false);
      toaster.create({
        title: "Couldn't create tournament",
        description: "Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  };

  return (
    <Box
      p={{ base: 4, md: 8 }}
      maxW="1400px"
      mx="auto"
      w="full"
      minH="calc(100vh - 80px)"
    >
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        {/* Header Section */}
        <Box textAlign="center" py={{ base: 4, md: 8 }}>
          <Text
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="bold"
            mb={4}
          >
            Choose Your Tournament Format
          </Text>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color="fg.muted"
            maxW="2xl"
            mx="auto"
            lineHeight="1.6"
          >
            Select the perfect tournament algorithm for your cricket
            competition. Each format offers unique advantages for different
            types of tournaments.
          </Text>
        </Box>

        {/* Algorithm Cards Grid */}
        <Box>
          <Flex
            gap={{ base: 4, md: 6 }}
            direction={{ base: "column", lg: "row" }}
            align="stretch"
          >
            {algorithms.map((algorithm) => (
              <AlgorithmCard
                key={algorithm.id}
                algorithm={algorithm}
                onSelect={() => openCreateDialog(algorithm)}
              />
            ))}
          </Flex>
        </Box>

        {/* Help Section */}
        <Box
          p={{ base: 4, md: 6 }}
          bg="bg.subtle"
          borderRadius="xl"
          textAlign="center"
        >
          <Heading size={{ base: "md", md: "lg" }} mb={3} color="fg.default">
            🤔 Need Help Choosing?
          </Heading>
          <VStack gap={3} maxW="4xl" mx="auto">
            <HStack gap={4} flexWrap="wrap" justify="center">
              <Text fontSize="sm" color="fg.muted">
                <Text as="span" fontWeight="bold" color="blue.600">
                  Quick Tournament:
                </Text>{" "}
                Single Elimination
              </Text>
              <Text fontSize="sm" color="fg.muted">
                <Text as="span" fontWeight="bold" color="orange.600">
                  Balanced:
                </Text>{" "}
                Double Elimination
              </Text>
              <Text fontSize="sm" color="fg.muted">
                <Text as="span" fontWeight="bold" color="purple.600">
                  Most Fair:
                </Text>{" "}
                Round Robin
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.subtle" fontStyle="italic">
              Round Robin is currently available. Other formats are coming soon!
            </Text>
          </VStack>
        </Box>
      </VStack>

      {/* Name + Create Dialog */}
      <Dialog.Root
        open={selected !== null}
        onOpenChange={(e) => !e.open && closeCreateDialog()}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="420px"
              bg="dialog.bg"
              borderRadius="xl"
              p={4}
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <Dialog.Header px={2} pb={3}>
                <VStack gap={1} w="full" align="center">
                  <Text fontSize="lg" fontWeight="500">
                    Name Your Tournament
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {selected?.icon} {selected?.name}
                  </Text>
                </VStack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    position="absolute"
                    top={4}
                    right={4}
                    size="sm"
                    color="fg.muted"
                    _hover={{ color: "fg.default", bg: "bg.subtle" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body p={2}>
                <VStack gap={4} w="full">
                  <Box w="full">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Tournament Name
                    </Text>
                    <Input
                      placeholder="e.g. Summer Cup 2026"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && name.trim() && !isCreating) {
                          handleCreate();
                        }
                      }}
                      maxLength={60}
                      size="lg"
                      autoFocus
                      bg="input.bg"
                      borderColor="input.border"
                      color="fg.default"
                      _placeholder={{ color: "fg.placeholder" }}
                      _focus={{
                        borderColor: "input.focusBorder",
                        boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                      }}
                    />
                  </Box>

                  <HStack gap={3} w="full">
                    <Button
                      variant="outline"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      colorPalette="gray"
                      fontWeight="500"
                      onClick={closeCreateDialog}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="blue"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={handleCreate}
                      disabled={!name.trim()}
                      loading={isCreating}
                    >
                      Create
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}

interface AlgorithmCardProps {
  algorithm: TournamentAlgorithm;
  onSelect: () => void;
}

function AlgorithmCard({ algorithm, onSelect }: AlgorithmCardProps) {
  return (
    <Card.Root
      flex="1"
      minH={{ base: "auto", md: "400px" }}
      borderWidth={2}
      borderColor={
        algorithm.isAvailable ? `${algorithm.color}.200` : "border.default"
      }
      bg={algorithm.isAvailable ? "card.bg" : "bg.subtle"}
      opacity={algorithm.isAvailable ? 1 : 0.7}
      cursor={algorithm.isAvailable ? "pointer" : "not-allowed"}
      transition="all 0.2s"
      onClick={algorithm.isAvailable ? onSelect : undefined}
      _hover={
        algorithm.isAvailable
          ? {
              borderColor: `${algorithm.color}.400`,
              transform: "translateY(-4px)",
              shadow: "lg",
            }
          : {}
      }
      position="relative"
      overflow="hidden"
    >
      {/* Coming Soon Overlay */}
      {!algorithm.isAvailable && (
        <Box position="absolute" top={4} right={4} zIndex={2}>
          <Badge
            colorPalette="gray"
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
          >
            Coming Soon
          </Badge>
        </Box>
      )}

      <Card.Body p={{ base: 5, md: 6 }}>
        <VStack align="stretch" gap={4} h="full">
          {/* Header */}
          <VStack align="center" gap={3}>
            <Text fontSize={{ base: "3xl", md: "4xl" }} color="fg.default">
              {algorithm.icon}
            </Text>
            <VStack gap={1}>
              <Heading
                size={{ base: "md", md: "lg" }}
                textAlign="center"
                color={
                  algorithm.isAvailable ? `${algorithm.color}.600` : "fg.muted"
                }
              >
                {algorithm.name}
              </Heading>
              <Text
                fontSize="sm"
                color="fg.muted"
                textAlign="center"
                lineHeight="1.5"
              >
                {algorithm.description}
              </Text>
            </VStack>
          </VStack>

          {/* Details */}
          <VStack align="stretch" gap={4} flex="1">
            {/* Info Badges */}
            <VStack gap={2}>
              <HStack justify="space-between" w="full" flexWrap="wrap" gap={2}>
                <Badge
                  colorPalette={algorithm.color}
                  variant="subtle"
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {algorithm.estimatedTime}
                </Badge>
                <Badge
                  colorPalette="gray"
                  variant="outline"
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {algorithm.bestFor}
                </Badge>
              </HStack>
            </VStack>

            {/* Features List */}
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                Key Features:
              </Text>
              <VStack align="stretch" gap={1}>
                {algorithm.features.map((feature, index) => (
                  <HStack key={index} gap={2} align="start">
                    <Text color={`${algorithm.color}.500`} fontSize="xs">
                      ●
                    </Text>
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.4">
                      {feature}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>

            {/* Action Button */}
            <Box mt="auto" pt={4}>
              <Button
                w="full"
                colorPalette={algorithm.isAvailable ? algorithm.color : "gray"}
                disabled={!algorithm.isAvailable}
                variant={algorithm.isAvailable ? "solid" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (algorithm.isAvailable) onSelect();
                }}
              >
                {algorithm.isAvailable ? "Start Tournament" : "Coming Soon"}
              </Button>
            </Box>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
