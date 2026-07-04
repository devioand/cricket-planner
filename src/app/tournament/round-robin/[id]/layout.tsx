import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { TournamentProvider } from "@/contexts/tournament-context";
import { RoundRobinShell } from "@/components/tournaments/round-robin-shell";
import { saveTournamentStateAction } from "@/app/tournaments/actions";

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

  // A finished tournament is read-only (view its final results/standings).
  const readOnly = record.status === "completed";

  return (
    <TournamentProvider
      tournamentId={record.id}
      initialState={record.state}
      readOnly={readOnly}
      persist={saveTournamentStateAction}
    >
      <RoundRobinShell>{children}</RoundRobinShell>
    </TournamentProvider>
  );
}
