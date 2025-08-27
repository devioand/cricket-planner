"use client";

import { Box, Heading, Text, VStack, Button } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function SingleEliminationTournament() {
  const router = useRouter();

  return (
    <Box
      p={{ base: 4, md: 8 }}
      maxW="800px"
      mx="auto"
      w="full"
      textAlign="center"
      minH="calc(100vh - 200px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack gap={6}>
        <Text fontSize="6xl">⚡</Text>
        <Heading size={{ base: "lg", md: "xl" }} color="red.600">
          Single Elimination Tournament
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="xl">
          Knockout format where one loss eliminates a team. Fast and exciting
          tournament format.
        </Text>
        <VStack
          gap={4}
          p={6}
          bg="orange.50"
          borderRadius="lg"
          border="2px dashed"
          borderColor="orange.200"
        >
          <Text fontSize="2xl">🚧</Text>
          <Text fontWeight="bold" color="orange.700">
            Coming Soon!
          </Text>
          <Text fontSize="sm" color="orange.600">
            This tournament format is currently under development. We&apos;re
            working hard to bring you the best single elimination experience.
          </Text>
        </VStack>
        <Button onClick={() => router.push("/")} colorScheme="blue" size="lg">
          ← Back to Algorithm Selection
        </Button>
      </VStack>
    </Box>
  );
}
