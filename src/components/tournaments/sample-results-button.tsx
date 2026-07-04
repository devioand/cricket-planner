"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateSampleResultsAction } from "@/app/tournament/round-robin/[id]/actions";

/** Dev-only helper to fill scheduled matches with random scores. */
export function SampleResultsButton({
  tournamentId,
  pending,
}: {
  tournamentId: string;
  pending: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      colorPalette="purple"
      variant="outline"
      alignSelf="flex-start"
      loading={isPending}
      onClick={() =>
        startTransition(() => generateSampleResultsAction(tournamentId))
      }
    >
      🎲 Generate Sample Results ({pending} pending)
    </Button>
  );
}
