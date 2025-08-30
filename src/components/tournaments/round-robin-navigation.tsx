"use client";

import { Box, HStack } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTournament } from "@/contexts/tournament-context";
import { Button } from "../ui/button";

export function RoundRobinNavigation() {
  const pathname = usePathname();
  const tournament = useTournament();

  const navItems = [
    {
      href: "/tournament/round-robin/setup",
      label: "🏏 Setup",
      isActive: pathname === "/tournament/round-robin/setup",
      isEnabled: true,
    },
    {
      href: "/tournament/round-robin/matches",
      label: "⚽ Matches",
      isActive: pathname === "/tournament/round-robin/matches",
      isEnabled: tournament.state.isGenerated,
    },
    {
      href: "/tournament/round-robin/standings",
      label: "🏆 Standings",
      isActive: pathname === "/tournament/round-robin/standings",
      isEnabled: tournament.state.isGenerated,
    },
  ];

  return (
    <Box
      bg="white"
      borderWidth={1}
      borderColor="gray.200"
      borderRadius="lg"
      p={2}
      mb={6}
      shadow="sm"
    >
      <HStack gap={1} overflowX="auto" w="full">
        {navItems.map((item) => (
          <NavButton
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={item.isActive}
            isEnabled={item.isEnabled}
          />
        ))}
      </HStack>
    </Box>
  );
}

interface NavButtonProps {
  href: string;
  label: string;
  isActive: boolean;
  isEnabled: boolean;
}

function NavButton({ href, label, isActive, isEnabled }: NavButtonProps) {
  const buttonContent = (
    <Button
      size={{ base: "sm", md: "md" }}
      variant={isActive ? "solid" : "ghost"}
      colorPalette={isActive ? "blue" : "gray"}
      w="full"
      opacity={isEnabled ? 1 : 0.5}
      cursor={isEnabled ? "pointer" : "not-allowed"}
      fontSize={{ base: "xs", md: "sm" }}
      px={{ base: 2, md: 4 }}
      disabled={!isEnabled}
      _disabled={{
        opacity: 0.5,
        cursor: "not-allowed",
        _hover: {},
      }}
    >
      {label}
    </Button>
  );

  return isEnabled ? (
    <Link href={href} style={{ flex: "1" }}>
      {buttonContent}
    </Link>
  ) : (
    <Box flex="1">{buttonContent}</Box>
  );
}
