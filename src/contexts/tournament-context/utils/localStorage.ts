// localStorage utilities for tournament state persistence

import type { TournamentState } from "../types";
import { initialTournamentState } from "../state";

const STORAGE_KEY = "cricket-tournament-state";

/**
 * Save tournament state to localStorage
 */
export function saveTournamentState(state: TournamentState): void {
  try {
    if (typeof window === "undefined") return; // SSR safety

    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
    console.log("💾 Tournament state saved to localStorage");
  } catch (error) {
    console.warn("⚠️ Failed to save tournament state to localStorage:", error);
  }
}

/**
 * Load tournament state from localStorage
 */
export function loadTournamentState(): TournamentState {
  try {
    if (typeof window === "undefined") return initialTournamentState; // SSR safety

    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (!serializedState) {
      console.log("📁 No saved tournament state found");
      return initialTournamentState;
    }

    const parsedState = JSON.parse(serializedState) as TournamentState;

    // Validate that the parsed state has the expected structure
    if (!isValidTournamentState(parsedState)) {
      console.warn(
        "⚠️ Invalid tournament state in localStorage, using default"
      );
      clearTournamentState(); // Clear corrupted data
      return initialTournamentState;
    }

    console.log("✅ Tournament state loaded from localStorage");
    return parsedState;
  } catch (error) {
    console.warn(
      "⚠️ Failed to load tournament state from localStorage:",
      error
    );
    clearTournamentState(); // Clear corrupted data
    return initialTournamentState;
  }
}

/**
 * Clear tournament state from localStorage
 */
export function clearTournamentState(): void {
  try {
    if (typeof window === "undefined") return; // SSR safety

    localStorage.removeItem(STORAGE_KEY);
    console.log("🗑️ Tournament state cleared from localStorage");
  } catch (error) {
    console.warn(
      "⚠️ Failed to clear tournament state from localStorage:",
      error
    );
  }
}

/**
 * Basic validation to ensure the loaded state has the expected structure
 */
function isValidTournamentState(state: unknown): state is TournamentState {
  if (!state || typeof state !== "object" || state === null) {
    return false;
  }

  const stateObj = state as Record<string, unknown>;

  return (
    Array.isArray(stateObj.teams) &&
    typeof stateObj.algorithm === "string" &&
    typeof stateObj.maxOvers === "number" &&
    typeof stateObj.maxWickets === "number" &&
    Array.isArray(stateObj.matches) &&
    typeof stateObj.teamStats === "object" &&
    stateObj.teamStats !== null &&
    typeof stateObj.phase === "string" &&
    typeof stateObj.playoffFormat === "string"
  );
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;

    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
