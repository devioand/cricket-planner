// World Cup style playoff algorithms for cricket tournaments

import type { Match, TournamentState } from "../types";
import { getTournamentStandings } from "./cricket-stats";

/**
 * Generates world cup style playoff matches based on current tournament standings
 * - 3 teams: Top 2 teams play in Final (simple format)
 * - 4+ teams: Top 4 teams advance to playoffs (semi-finals)
 */
export function generateWorldCupPlayoffMatches(state: TournamentState): {
  success: boolean;
  playoffMatches: Match[];
  qualifiedTeams: string[];
  errors?: string[];
} {
  console.log("\n🏆 Starting world cup style playoff generation...");

  // Validate that round robin is complete
  const incompleteMatches = state.matches.filter(
    (match) => !match.isPlayoff && match.status === "scheduled"
  );

  if (incompleteMatches.length > 0) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: [
        "All round robin matches must be completed before playoffs can begin",
      ],
    };
  }

  // Get current standings
  const standings = getTournamentStandings(state.teamStats);

  if (standings.length < 3) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: ["At least 3 teams are required for playoffs"],
    };
  }

  // Handle 3-team tournament (Simple Final format)
  if (standings.length === 3) {
    const qualifiedTeams = standings.slice(0, 2).map((team) => team.teamName);
    console.log(
      "🎯 3-team tournament - Top 2 qualified teams:",
      qualifiedTeams
    );

    const playoffMatches: Match[] = [];

    // Final: 1st vs 2nd (3rd team is eliminated)
    const final: Match = {
      id: `F-001`,
      team1: qualifiedTeams[0], // 1st place
      team2: qualifiedTeams[1], // 2nd place
      round: 1,
      status: "scheduled",
      overs: state.maxOvers,
      maxWickets: state.maxWickets,
      isPlayoff: true,
      playoffType: "final",
      phase: "playoffs",
    };

    playoffMatches.push(final);

    console.log("🏆 Final:", `${final.team1} vs ${final.team2}`);
    console.log("📊 3rd place team is eliminated from playoffs");

    return {
      success: true,
      playoffMatches,
      qualifiedTeams,
    };
  }

  // Handle 4+ team tournament (Standard World Cup format)
  if (standings.length < 4) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: ["At least 4 teams are required for standard World Cup playoffs"],
    };
  }

  // Get top 4 teams
  const qualifiedTeams = standings.slice(0, 4).map((team) => team.teamName);
  console.log("🎯 Qualified teams:", qualifiedTeams);

  // Generate playoff matches
  const playoffMatches: Match[] = [];

  // Semi-final 1: 1st vs 4th
  const semiFinal1: Match = {
    id: `SF-001`,
    team1: qualifiedTeams[0], // 1st place
    team2: qualifiedTeams[3], // 4th place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "semi-final-1",
    phase: "playoffs",
  };

  // Semi-final 2: 2nd vs 3rd
  const semiFinal2: Match = {
    id: `SF-002`,
    team1: qualifiedTeams[1], // 2nd place
    team2: qualifiedTeams[2], // 3rd place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "semi-final-2",
    phase: "playoffs",
  };

  // Generate Final with placeholder teams
  const final: Match = {
    id: `F-001`,
    team1: "TBD", // Winner of Semi-final 1
    team2: "TBD", // Winner of Semi-final 2
    round: 2,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "final",
    phase: "playoffs",
  };

  playoffMatches.push(semiFinal1, semiFinal2, final);

  console.log("⚡ Semi-final 1:", `${semiFinal1.team1} vs ${semiFinal1.team2}`);
  console.log("⚡ Semi-final 2:", `${semiFinal2.team1} vs ${semiFinal2.team2}`);
  console.log(
    "🏆 Final: TBD vs TBD (Generated when both semi-finals complete)"
  );

  return {
    success: true,
    playoffMatches,
    qualifiedTeams,
  };
}

/**
 * Generates world cup style final after semi-finals are complete
 */
export function generateWorldCupFinalMatches(state: TournamentState): {
  success: boolean;
  finalMatches: Match[];
  errors?: string[];
} {
  console.log("\n🏆 Generating world cup style final match...");

  // Find completed semi-finals in the main matches array (where results are stored)
  const semiFinals = state.matches.filter(
    (match) =>
      match.isPlayoff &&
      match.playoffType?.startsWith("semi-final") &&
      match.status === "completed"
  );

  if (semiFinals.length !== 2) {
    return {
      success: false,
      finalMatches: [],
      errors: ["Both semi-finals must be completed before generating finals"],
    };
  }

  const finalMatches: Match[] = [];

  // Get winners from semi-finals
  const sf1 = semiFinals.find((m) => m.playoffType === "semi-final-1");
  const sf2 = semiFinals.find((m) => m.playoffType === "semi-final-2");

  if (!sf1?.result || !sf2?.result) {
    return {
      success: false,
      finalMatches: [],
      errors: ["Semi-final results not found"],
    };
  }

  // Final: SF1 winner vs SF2 winner
  const final: Match = {
    id: `F-001`,
    team1: sf1.result.winner,
    team2: sf2.result.winner,
    round: 2,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "final",
    phase: "playoffs",
  };

  finalMatches.push(final);

  console.log("🏆 Final:", `${final.team1} vs ${final.team2}`);
  console.log("🥉 Semi-final losers both ranked 3rd place");

  return {
    success: true,
    finalMatches,
  };
}

/**
 * Checks if all round robin matches are complete
 */
export function isRoundRobinComplete(state: TournamentState): boolean {
  const roundRobinMatches = state.matches.filter((match) => !match.isPlayoff);
  const incompleteMatches = roundRobinMatches.filter(
    (match) => match.status === "scheduled"
  );

  return incompleteMatches.length === 0 && roundRobinMatches.length > 0;
}

/**
 * Checks if playoffs can be generated (round robin complete + minimum teams)
 */
export function canGeneratePlayoffs(state: TournamentState): {
  canGenerate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!isRoundRobinComplete(state)) {
    reasons.push("Round robin phase must be completed first");
  }

  const standings = getTournamentStandings(state.teamStats);
  if (standings.length < 3) {
    reasons.push("Minimum 3 teams required for playoffs");
  }

  if (state.playoffMatches.length > 0) {
    reasons.push("Playoffs already generated");
  }

  return {
    canGenerate: reasons.length === 0,
    reasons,
  };
}

/**
 * Checks if final matches can be generated (semi-finals complete)
 */
export function canGenerateFinals(state: TournamentState): {
  canGenerate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  const semiFinals = state.matches.filter(
    (match) => match.isPlayoff && match.playoffType?.startsWith("semi-final")
  );

  if (semiFinals.length !== 2) {
    reasons.push("Semi-finals not generated yet");
    return { canGenerate: false, reasons };
  }

  const completedSemiFinals = semiFinals.filter(
    (match) => match.status === "completed"
  );

  if (completedSemiFinals.length !== 2) {
    reasons.push("Both semi-finals must be completed");
  }

  const finalExists = state.matches.some(
    (match) => match.isPlayoff && match.playoffType === "final"
  );

  if (finalExists) {
    reasons.push("Final already generated");
  }

  return {
    canGenerate: reasons.length === 0,
    reasons,
  };
}

/**
 * Gets the current playoff phase status
 */
export function getPlayoffStatus(state: TournamentState): {
  phase: "not-started" | "semi-finals" | "finals" | "completed";
  description: string;
  nextAction?: string;
} {
  if (!isRoundRobinComplete(state)) {
    return {
      phase: "not-started",
      description: "Round robin phase in progress",
      nextAction: "Complete all round robin matches",
    };
  }

  const semiFinals = state.matches.filter(
    (match) => match.isPlayoff && match.playoffType?.startsWith("semi-final")
  );

  const finals = state.matches.filter(
    (match) => match.isPlayoff && match.playoffType === "final"
  );

  if (semiFinals.length === 0) {
    return {
      phase: "not-started",
      description: "Ready to generate playoffs",
      nextAction: "Generate playoff matches",
    };
  }

  const completedSemiFinals = semiFinals.filter(
    (match) => match.status === "completed"
  );

  if (completedSemiFinals.length < 2) {
    return {
      phase: "semi-finals",
      description: `Semi-finals in progress (${completedSemiFinals.length}/2 completed)`,
      nextAction: "Complete remaining semi-final matches",
    };
  }

  if (finals.length === 0) {
    return {
      phase: "semi-finals",
      description: "Semi-finals completed",
      nextAction: "Generate final matches",
    };
  }

  const completedFinals = finals.filter(
    (match) => match.status === "completed"
  );

  if (completedFinals.length < 1) {
    return {
      phase: "finals",
      description: "Final is ready",
      nextAction: "Complete the final match",
    };
  }

  return {
    phase: "completed",
    description: "Tournament completed!",
  };
}
