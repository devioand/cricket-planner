import { notFound } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { getTournamentWinner } from "@/contexts/tournament-context/engine";
import { CompletedBanner } from "@/components/tournaments/completed-banner";
import { RoundRobinNavigation } from "@/components/tournaments/round-robin-navigation";

export default async function RoundRobinTournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const record = await getTournament(user.id, id);
  if (!record) notFound();

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <CompletedBanner
        completed={record.status === "completed"}
        winner={getTournamentWinner(record.state)}
      />
      <RoundRobinNavigation id={id} isGenerated={record.state.isGenerated} />
      {children}
    </Box>
  );
}
