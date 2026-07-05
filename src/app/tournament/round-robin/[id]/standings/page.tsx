import { StandingsView } from "@/components/tournaments/standings-view";

// Auth + tournament load happen once in the layout, which seeds the live store.
export default function RoundRobinStandings() {
  return <StandingsView />;
}
