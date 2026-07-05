import { MatchesView } from "@/components/tournaments/matches-view";

// Auth + tournament load happen once in the layout, which seeds the live store.
// This page just renders the client view that reads from it.
export default function RoundRobinMatches() {
  return <MatchesView />;
}
