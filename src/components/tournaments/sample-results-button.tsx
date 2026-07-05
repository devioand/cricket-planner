"use client";

import { Button } from "@/components/ui/button";
import { useTournamentStore } from "@/contexts/tournament-context/live-provider";

/** Dev-only helper to fill scheduled matches with random scores (instant, local). */
export function SampleResultsButton({ pending }: { pending: number }) {
  const store = useTournamentStore();

  return (
    <Button
      size="sm"
      colorPalette="purple"
      variant="outline"
      alignSelf="flex-start"
      onClick={() => store.sampleResults()}
    >
      🎲 Generate Sample Results ({pending} pending)
    </Button>
  );
}
