import { SetupWizard } from "@/components/tournaments/wizard/setup-wizard";

// Auth + tournament load happen once in the layout, which seeds the live store.
export default function RoundRobinSetup() {
  return <SetupWizard />;
}
