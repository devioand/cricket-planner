"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  syncTournamentAction,
  finishTournamentAction,
} from "@/app/tournament/round-robin/[id]/actions";
import { useTournamentStore } from "@/contexts/tournament-context/live-provider";
import { toaster } from "@/components/ui/toaster";

/**
 * Sync the live tournament to the DB. Reads the freshest snapshot at call time,
 * keeps localStorage, and records the returned `updated_at` as last-synced.
 */
export function useSyncTournament() {
  const store = useTournamentStore();
  return useMutation({
    mutationFn: () => syncTournamentAction(store.id, store.getSnapshot().state),
    onSuccess: ({ updatedAt }) => {
      store.markSynced(updatedAt);
      toaster.create({
        title: "Synced to database",
        type: "success",
        duration: 2500,
      });
    },
    onError: () => {
      toaster.create({
        title: "Sync failed",
        description: "Your progress is still saved on this device. Try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    },
    retry: 1,
  });
}

/**
 * Finish & save: persist the final state, then clear localStorage and refresh
 * into the read-only DB view (the layout re-keys the provider on completion).
 */
export function useFinishTournament() {
  const router = useRouter();
  const store = useTournamentStore();
  return useMutation({
    mutationFn: () =>
      finishTournamentAction(store.id, store.getSnapshot().state),
    onSuccess: () => {
      store.clear();
      toaster.create({
        title: "Tournament saved 🏆",
        description: "Results are stored and now read-only.",
        type: "success",
        duration: 3000,
      });
      router.refresh();
    },
    onError: () => {
      toaster.create({
        title: "Couldn't finish tournament",
        description: "Your progress is still saved on this device. Try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    },
    retry: 1,
  });
}
