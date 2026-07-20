"use client";

import { useEffect, useSyncExternalStore } from "react";
import { clubStore, type ClubSnapshot } from "./club-store";

/**
 * Subscribe to the club. Returns `{ club, hydrated }` — check `hydrated`
 * before rendering an empty state, otherwise the first paint shows "no club"
 * and then swaps in the real one.
 */
export function useClub(): ClubSnapshot {
  const snapshot = useSyncExternalStore(
    clubStore.subscribe,
    clubStore.getSnapshot,
    clubStore.getServerSnapshot,
  );

  useEffect(() => {
    clubStore.hydrate();
  }, []);

  return snapshot;
}
