"use client";

import { Box, HStack, IconButton } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { LuInfo } from "react-icons/lu";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { TournamentDetailsDialog } from "@/components/tournaments/tournament-details-dialog";

/**
 * Compact tournament chrome: a two-way segmented control (Matches / Standings)
 * plus an info button for the read-only details. Setup is no longer a tab — a
 * generated tournament's focus is playing, so the shell stays minimal.
 */
export function RoundRobinNavigation({ name }: { name: string }) {
  const pathname = usePathname();
  const { store } = useLiveTournament();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const base = `/tournament/round-robin/${store.id}`;

  const tabs = [
    { href: `${base}/matches`, label: "Matches" },
    { href: `${base}/standings`, label: "Standings" },
  ];

  return (
    <>
      <HStack gap={2} mb={4} align="stretch">
        <HStack
          gap={1}
          flex="1"
          bg="bg.subtle"
          borderRadius="lg"
          p={1}
          borderWidth={1}
          borderColor="border.subtle"
        >
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{ flex: 1, display: "flex" }}
              >
                <Box
                  w="full"
                  textAlign="center"
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight={active ? "semibold" : "medium"}
                  colorPalette="blue"
                  bg={active ? "colorPalette.500" : "transparent"}
                  color={active ? "white" : "fg.muted"}
                  transition="all 0.15s"
                  _hover={active ? {} : { color: "fg.default" }}
                >
                  {tab.label}
                </Box>
              </Link>
            );
          })}
        </HStack>

        <IconButton
          aria-label="Tournament details"
          variant="outline"
          colorPalette="gray"
          onClick={() => setDetailsOpen(true)}
          flexShrink={0}
        >
          <LuInfo />
        </IconButton>
      </HStack>

      <TournamentDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        name={name}
      />
    </>
  );
}
