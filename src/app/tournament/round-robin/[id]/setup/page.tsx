import { SetupForm } from "@/components/tournaments/setup-form";

// Auth + tournament load happen once in the layout, which seeds the live store.
export default function RoundRobinSetup() {
  return <SetupForm />;
}
