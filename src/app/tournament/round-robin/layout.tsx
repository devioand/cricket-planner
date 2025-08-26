"use client";

import { Box } from "@chakra-ui/react";
import { RoundRobinNavigation } from "@/components/tournaments/round-robin-navigation";

export default function RoundRobinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      {/* Navigation */}
      <RoundRobinNavigation />

      {/* Page Content */}
      {children}
    </Box>
  );
}
