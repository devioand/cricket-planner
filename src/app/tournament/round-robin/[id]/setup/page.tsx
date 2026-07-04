import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getTournament } from "@/lib/repositories/tournament-repository";
import { SetupForm } from "@/components/tournaments/setup-form";

export default async function RoundRobinSetup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const record = await getTournament(user.id, id);
  if (!record) notFound();

  return <SetupForm state={record.state} tournamentId={id} />;
}
