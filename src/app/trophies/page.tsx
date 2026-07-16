import Link from "next/link";
import { Box, Heading, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { LuTrophy } from "react-icons/lu";
import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { Button } from "@/components/ui/button";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import type { TrophyConfig } from "@/contexts/tournament-context/types";

export const dynamic = "force-dynamic";

export default async function TrophiesPage() {
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

  // A trophy is earned once a tournament is completed and has a champion.
  const earned = tournaments.filter((t) => t.status === "completed" && t.winner);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={1}>
          <Heading size={{ base: "lg", md: "xl" }}>Trophies</Heading>
          <Text fontSize="sm" color="fg.muted">
            {earned.length > 0
              ? `${earned.length} ${earned.length === 1 ? "trophy" : "trophies"} in your cabinet.`
              : "Your trophy cabinet."}
          </Text>
        </VStack>

        {earned.length === 0 ? (
          <EmptyCabinet />
        ) : (
          <SimpleGrid columns={2} gap={{ base: 3, sm: 4 }}>
            {earned.map((t) => {
              // Fall back to a default gold cup for tournaments created before
              // trophies existed (or where none was designed).
              const config: TrophyConfig = t.trophy ?? {
                shape: "classic",
                metal: "gold",
              };
              const won = new Date(t.updatedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <Box
                  key={t.id}
                  py={5}
                  px={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="card.bg"
                >
                  <VStack gap={2.5}>
                    <TrophyBadge config={config} size="lg" showWonBy={false} />
                    <VStack gap={0.5}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        textAlign="center"
                        lineHeight="1.25"
                      >
                        {t.name}
                      </Text>
                      {t.winner && (
                        <Text fontSize="xs" color="fg.muted" textAlign="center">
                          🏅 {t.winner} · {won}
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </VStack>
    </Box>
  );
}

function EmptyCabinet() {
  return (
    <VStack
      gap={4}
      py={{ base: 12, md: 16 }}
      textAlign="center"
      borderRadius="xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
    >
      <Box fontSize="5xl" color="fg.muted" lineHeight="1" opacity={0.6}>
        <LuTrophy />
      </Box>
      <VStack gap={1}>
        <Heading size="md">No trophies yet</Heading>
        <Text fontSize="sm" color="fg.muted" maxW="320px">
          Design a trophy when you set up a tournament — win it, and it lands
          here.
        </Text>
      </VStack>
      <Link href="/tournaments">
        <Button colorPalette="blue" size="sm">
          Go to tournaments
        </Button>
      </Link>
    </VStack>
  );
}
