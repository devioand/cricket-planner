"use client";

import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Flex,
} from "@chakra-ui/react";
import Link from "next/link";

interface TournamentAlgorithm {
  id: string;
  name: string;
  description: string;
  features: string[];
  isAvailable: boolean;
  icon: string;
  color: string;
  estimatedTime: string;
  bestFor: string;
  route?: string;
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
    route: "/tournament/round-robin",
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
    route: "/tournament/single-elimination",
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
    route: "/tournament/double-elimination",
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
    route: "/tournament/triple-elimination",
  },
];

export default function TournamentSelection() {
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
            🏏 Choose Your Tournament Format
          </Text>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color="gray.600"
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
              <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
            ))}
          </Flex>
        </Box>

        {/* Help Section */}
        <Box
          p={{ base: 4, md: 6 }}
          bg="gray.50"
          borderRadius="xl"
          textAlign="center"
        >
          <Heading size={{ base: "md", md: "lg" }} mb={3} color="gray.700">
            🤔 Need Help Choosing?
          </Heading>
          <VStack gap={3} maxW="4xl" mx="auto">
            <HStack gap={4} flexWrap="wrap" justify="center">
              <Text fontSize="sm" color="gray.600">
                <Text as="span" fontWeight="bold" color="blue.600">
                  Quick Tournament:
                </Text>{" "}
                Single Elimination
              </Text>
              <Text fontSize="sm" color="gray.600">
                <Text as="span" fontWeight="bold" color="orange.600">
                  Balanced:
                </Text>{" "}
                Double Elimination
              </Text>
              <Text fontSize="sm" color="gray.600">
                <Text as="span" fontWeight="bold" color="purple.600">
                  Most Fair:
                </Text>{" "}
                Round Robin
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
              Round Robin is currently available. Other formats are coming soon!
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

interface AlgorithmCardProps {
  algorithm: TournamentAlgorithm;
}

function AlgorithmCard({ algorithm }: AlgorithmCardProps) {
  const cardContent = (
    <Card.Root
      flex="1"
      minH={{ base: "auto", md: "400px" }}
      borderWidth={2}
      borderColor={
        algorithm.isAvailable ? `${algorithm.color}.200` : "gray.200"
      }
      bg={algorithm.isAvailable ? "white" : "gray.50"}
      opacity={algorithm.isAvailable ? 1 : 0.7}
      cursor="pointer"
      transition="all 0.2s"
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
            colorScheme="gray"
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
            <Text fontSize={{ base: "3xl", md: "4xl" }}>{algorithm.icon}</Text>
            <VStack gap={1}>
              <Heading
                size={{ base: "md", md: "lg" }}
                textAlign="center"
                color={
                  algorithm.isAvailable ? `${algorithm.color}.600` : "gray.500"
                }
              >
                {algorithm.name}
              </Heading>
              <Text
                fontSize="sm"
                color="gray.600"
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
                  colorScheme={algorithm.color}
                  variant="subtle"
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {algorithm.estimatedTime}
                </Badge>
                <Badge
                  colorScheme="gray"
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
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Key Features:
              </Text>
              <VStack align="stretch" gap={1}>
                {algorithm.features.map((feature, index) => (
                  <HStack key={index} gap={2} align="start">
                    <Text color={`${algorithm.color}.500`} fontSize="xs">
                      ●
                    </Text>
                    <Text fontSize="sm" color="gray.600" lineHeight="1.4">
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
                colorScheme={algorithm.isAvailable ? algorithm.color : "gray"}
                size={{ base: "md", md: "lg" }}
                minH={{ base: "44px", md: "48px" }}
                disabled={!algorithm.isAvailable}
                variant={algorithm.isAvailable ? "solid" : "outline"}
              >
                {algorithm.isAvailable ? "Start Tournament" : "Coming Soon"}
              </Button>
            </Box>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );

  return algorithm.route ? (
    <Link href={algorithm.route} style={{ display: "flex" }}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}
