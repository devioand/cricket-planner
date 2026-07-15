import { LuMedal } from "react-icons/lu";
import { requireUser } from "@/lib/session";
import { ComingSoon } from "@/components/layout/coming-soon";

export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  await requireUser();

  return (
    <ComingSoon
      icon={LuMedal}
      title="Awards"
      description="Standout performances — MVPs, best batting and bowling sides, biggest wins and nail-biters — collected across your tournaments."
    />
  );
}
