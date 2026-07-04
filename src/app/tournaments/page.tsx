import { requireUser } from "@/lib/session";
import { listTournaments } from "@/lib/repositories/tournament-repository";
import { TournamentsList } from "@/components/tournaments/tournaments-list";
import type { TournamentType } from "@/contexts/tournament-context/types";

export const dynamic = "force-dynamic";

const VALID_FORMATS: TournamentType[] = [
  "round-robin",
  "single-elimination",
  "double-elimination",
  "triple-elimination",
];

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const user = await requireUser();
  const tournaments = await listTournaments(user.id);

  const { create } = await searchParams;
  const initialCreateFormat =
    create && VALID_FORMATS.includes(create as TournamentType)
      ? (create as TournamentType)
      : null;

  return (
    <TournamentsList
      tournaments={tournaments}
      initialCreateFormat={initialCreateFormat}
    />
  );
}
