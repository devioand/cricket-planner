"use client";

import { Box, HStack } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";

export function RoundRobinNavigation() {
  const pathname = usePathname();
  const { state, store } = useLiveTournament();
  const base = `/tournament/round-robin/${store.id}`;
  const isGenerated = state.isGenerated;

  const navItems = [
    {
      href: `${base}/setup`,
      label: "🏏 Setup",
      isActive: pathname === `${base}/setup`,
      isEnabled: true,
    },
    {
      href: `${base}/matches`,
      label: "⚽ Matches",
      isActive: pathname === `${base}/matches`,
      isEnabled: isGenerated,
    },
    {
      href: `${base}/standings`,
      label: "🏆 Standings",
      isActive: pathname === `${base}/standings`,
      isEnabled: isGenerated,
    },
  ];

  return (
    <Box
      bg="card.bg"
      borderWidth={1}
      borderColor="border.default"
      borderRadius="xl"
      p={3}
      mb={6}
      shadow="sm"
    >
      <HStack gap={2} overflowX="auto" w="full">
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
    <Box
      as="button"
      w="full"
      px={{ base: 3, md: 4 }}
      py={{ base: 2.5, md: 3 }}
      borderRadius="lg"
      fontSize={{ base: "sm", md: "md" }}
      fontWeight={isActive ? "semibold" : "medium"}
      transition="all 0.2s ease"
      bg={isActive ? "colorPalette.500" : "bg.subtle"}
      color={isActive ? "white" : isEnabled ? "fg.default" : "fg.disabled"}
      borderColor={isEnabled ? "transparent" : "border.subtle"}
      opacity={isEnabled ? 1 : 0.6}
      cursor={isEnabled ? "pointer" : "not-allowed"}
      colorPalette="blue"
      _hover={
        isEnabled ? { bg: isActive ? "colorPalette.600" : "bg.subtle" } : {}
      }
    >
      {label}
    </Box>
  );

  return isEnabled ? (
    <Link href={href} style={{ flex: "1", display: "flex" }}>
      {buttonContent}
    </Link>
  ) : (
    <Box flex="1" display="flex">
      {buttonContent}
    </Box>
  );
}
