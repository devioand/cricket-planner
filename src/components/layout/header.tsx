"use client";

import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Text,
  Button,
} from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useRouter, usePathname } from "next/navigation";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isTournamentPage = pathname.startsWith("/tournament/");

  return (
    <Box
      as="header"
      bg="bg.surface"
      borderBottomWidth="1px"
      borderBottomColor="border.default"
      py={4}
    >
      <Container maxW="7xl">
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Box
              fontSize="2xl"
              role="img"
              aria-label="Cricket"
              cursor={!isHomePage ? "pointer" : "default"}
              onClick={() => !isHomePage && router.push("/")}
              transition="transform 0.2s"
              _hover={!isHomePage ? { transform: "scale(1.1)" } : {}}
            >
              🏏
            </Box>
            <Box>
              <Heading
                size="md"
                lineHeight="1"
                cursor={!isHomePage ? "pointer" : "default"}
                onClick={() => !isHomePage && router.push("/")}
                _hover={!isHomePage ? { color: "blue.500" } : {}}
                transition="color 0.2s"
              >
                Cricket Planner
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                {isTournamentPage
                  ? "Round Robin Tournament"
                  : "Tournament Management System"}
              </Text>
            </Box>
          </HStack>

          <HStack gap={3}>
            {isTournamentPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                colorScheme="blue"
              >
                ← Back to Algorithms
              </Button>
            )}
            <ColorModeButton />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
