import { notFound } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { getTournamentWinner } from "@/contexts/tournament-context/engine";
import { CompletedBanner } from "@/components/tournaments/completed-banner";
import { TournamentHeader } from "@/components/tournaments/tournament-header";
import { LiveTournamentProvider } from "@/contexts/tournament-context/live-provider";

/**
 * Server shell for a tournament. This is the ONLY place that authenticates and
 * loads the tournament from the DB; it seeds the live client store, which then
 * owns all in-progress reads/writes (local-first). The completed banner reflects
 * the DB (a tournament is only "finished" after Finish & Save).
 */
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
    <LiveTournamentProvider
      key={record.status}
      init={{ id: record.id, status: record.status, state: record.state }}
    >
      <TournamentHeader name={record.name} />
      <Box
        maxW="600px"
        mx="auto"
        w="full"
        px={{ base: 4, md: 5 }}
        pt={5}
        pb={10}
      >
        <CompletedBanner
          completed={record.status === "completed"}
          winner={getTournamentWinner(record.state)}
        />
        {children}
      </Box>
    </LiveTournamentProvider>
  );
}
