import { notFound } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { getTournamentWinner } from "@/contexts/tournament-context/engine";
import { CompletedBanner } from "@/components/tournaments/completed-banner";
import { RoundRobinNavigation } from "@/components/tournaments/round-robin-navigation";
import { SyncBar } from "@/components/tournaments/sync-bar";
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
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <LiveTournamentProvider
        key={record.status}
        init={{ id: record.id, status: record.status, state: record.state }}
      >
        <CompletedBanner
          completed={record.status === "completed"}
          winner={getTournamentWinner(record.state)}
        />
        <RoundRobinNavigation />
        {children}
        {/* Sync / Finish live at the END of the content, not the top, so they
            are deliberate actions and can't be tapped by accident. */}
        <SyncBar />
      </LiveTournamentProvider>
    </Box>
  );
}
