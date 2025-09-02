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
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "../icons/logo";

export function Header() {
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
            {!isHomePage ? (
              <Link
                href="/"
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Box
                  fontSize="2xl"
                  role="img"
                  aria-label="Cricket"
                  transition="transform 0.2s"
                  _hover={{ transform: "scale(1.1)" }}
                  color="fg.default"
                >
                  <Logo />
                </Box>
                <Box>
                  <Heading
                    size="md"
                    lineHeight="1"
                    _hover={{ color: "blue.500" }}
                    transition="color 0.2s"
                  >
                    Cricket Planner
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {isTournamentPage
                      ? getPageTitle(pathname)
                      : "Tournament Management System"}
                  </Text>
                </Box>
              </Link>
            ) : (
              <>
                <Box color="fg.default">
                  <Logo />
                </Box>
                <Box>
                  <Heading size="md" lineHeight="1">
                    Cricket Planner
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    Tournament Management System
                  </Text>
                </Box>
              </>
            )}
          </HStack>

          <HStack gap={3}>
            {isTournamentPage && (
              <Link href="/">
                <Button variant="outline" size="sm" colorPalette="blue">
                  ← Back to Algorithms
                </Button>
              </Link>
            )}
            <ColorModeButton />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname.includes("/setup")) return "Tournament Setup";
  if (pathname.includes("/matches")) return "Tournament Matches";
  if (pathname.includes("/standings")) return "Tournament Standings";
  if (pathname.includes("/round-robin")) return "Round Robin Tournament";
  return "Tournament Management System";
}
