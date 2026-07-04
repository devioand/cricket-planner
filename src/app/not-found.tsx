"use client";

import { Box, Heading, Text, VStack, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Box
      minH="calc(100vh - 80px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack gap={6} textAlign="center" maxW="lg" w="full">
        {/* Big playful 404 with a cricket ball as the zero */}
        <HStack gap={1} align="center" justify="center">
          <Heading
            fontSize={{ base: "7xl", md: "9xl" }}
            fontWeight="bold"
            color="colorPalette.500"
            colorPalette="blue"
            lineHeight="1"
          >
            4
          </Heading>
          <Box
            fontSize={{ base: "6xl", md: "8xl" }}
            role="img"
            aria-label="cricket ball"
            animation="spin 6s linear infinite"
            css={{
              "@keyframes spin": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
            }}
          >
            🏏
          </Box>
          <Heading
            fontSize={{ base: "7xl", md: "9xl" }}
            fontWeight="bold"
            color="colorPalette.500"
            colorPalette="blue"
            lineHeight="1"
          >
            4
          </Heading>
        </HStack>

        <VStack gap={2}>
          <Heading size={{ base: "lg", md: "xl" }} color="fg.default">
            That ball went for six!
          </Heading>
          <Text color="fg.muted" fontSize={{ base: "md", md: "lg" }} maxW="md">
            We couldn&apos;t find the page you were looking for. It may have
            been moved, deleted, or never existed.
          </Text>
        </VStack>

        <HStack gap={3} flexWrap="wrap" justify="center" pt={2}>
          <Link href="/">
            <Button colorPalette="blue" size="lg">
              🏠 Back to Home
            </Button>
          </Link>
          <Link href="/tournaments">
            <Button variant="outline" colorPalette="blue" size="lg">
              🏆 My Tournaments
            </Button>
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}
