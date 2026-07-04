"use client";

import { Box } from "@chakra-ui/react";
import { RoundRobinNavigation } from "@/components/tournaments/round-robin-navigation";
import { CompletedBanner } from "@/components/tournaments/completed-banner";

/** Visual shell for the round-robin flow (nav + centered content column). */
export function RoundRobinShell({ children }: { children: React.ReactNode }) {
  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <CompletedBanner />
      <RoundRobinNavigation />
      {children}
    </Box>
  );
}
