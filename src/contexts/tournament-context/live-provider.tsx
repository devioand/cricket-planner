"use client";

// Live tournament provider.
//
// Hosts a single `TournamentStore` for the current tournament and exposes it through
// context as a STABLE handle (so context itself never triggers re-renders). Reactive
// reads come exclusively from `useSyncExternalStore` — there is no `useState`/
// `useReducer`/`useEffect` for tournament state.

import { createContext, useContext, useRef, useSyncExternalStore } from "react";
import {
  TournamentStore,
  type StoreInit,
  type LocalSnapshot,
} from "@/lib/local/tournament-store";

const StoreContext = createContext<TournamentStore | null>(null);

export function LiveTournamentProvider({
  init,
  children,
}: {
  init: StoreInit;
  children: React.ReactNode;
}) {
  // Lazy, id-stable: create once; recreate only if the tournament id changes (the
  // same layout instance can be reused when navigating between two `[id]` values).
  const storeRef = useRef<TournamentStore | null>(null);
  if (storeRef.current === null || storeRef.current.id !== init.id) {
    storeRef.current = new TournamentStore(init);
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

/** The store handle — use for actions (`store.startMatch(...)`, `store.sync` helpers). */
export function useTournamentStore(): TournamentStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "useTournamentStore must be used within <LiveTournamentProvider>",
    );
  }
  return store;
}

/** Reactive snapshot + the store handle. Re-renders only when the snapshot changes. */
export function useLiveTournament(): LocalSnapshot & {
  store: TournamentStore;
} {
  const store = useTournamentStore();
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...snapshot, store };
}
