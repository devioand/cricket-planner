// League-style playoff algorithms (IPL/BBL format)

import type { Match, TournamentState } from "../types";
import { getTournamentStandings } from "./cricket-stats";

/**
 * Generates league-style playoff matches (IPL/BBL format)
 * Qualifier 1: 1st vs 2nd (Winner → Final, Loser → Qualifier 2)
 * Eliminator: 3rd vs 4th (Winner → Qualifier 2, Loser eliminated)
 * Qualifier 2: Loser Q1 vs Winner Eliminator (Winner → Final, Loser eliminated)
 * Final: Winner Q1 vs Winner Q2
 */
export function generateLeaguePlayoffMatches(state: TournamentState): {
  success: boolean;
  playoffMatches: Match[];
  qualifiedTeams: string[];
  errors?: string[];
} {
  console.log("\n🏆 Starting league-style playoff generation...");

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

  if (standings.length < 4) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: ["At least 4 teams are required for playoffs"],
    };
  }

  // Get top 4 teams
  const qualifiedTeams = standings.slice(0, 4).map((team) => team.teamName);
  console.log("🎯 Qualified teams:", qualifiedTeams);
  console.log("🏆 League format: Top 2 teams get second chance!");

  // Generate initial playoff matches
  const playoffMatches: Match[] = [];

  // Qualifier 1: 1st vs 2nd (Winner gets direct entry to final)
  const qualifier1: Match = {
    id: `Q1-001`,
    team1: qualifiedTeams[0], // 1st place
    team2: qualifiedTeams[1], // 2nd place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "qualifier-1",
    phase: "playoffs",
  };

  // Eliminator: 3rd vs 4th (Winner advances to Qualifier 2)
  const eliminator: Match = {
    id: `E-001`,
    team1: qualifiedTeams[2], // 3rd place
    team2: qualifiedTeams[3], // 4th place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "eliminator",
    phase: "playoffs",
  };

  // Generate Q2 and Final with placeholder teams
  const qualifier2: Match = {
    id: `Q2-001`,
    team1: "TBD", // Loser of Q1
    team2: "TBD", // Winner of Eliminator
    round: 2,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "qualifier-2",
    phase: "playoffs",
  };

  const final: Match = {
    id: `F-001`,
    team1: "TBD", // Winner of Q1
    team2: "TBD", // Winner of Q2
    round: 3,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "final",
    phase: "playoffs",
  };

  playoffMatches.push(qualifier1, eliminator, qualifier2, final);

  console.log(
    "⚡ Qualifier 1:",
    `${qualifier1.team1} vs ${qualifier1.team2} (Winner → Final)`
  );
  console.log(
    "💥 Eliminator:",
    `${eliminator.team1} vs ${eliminator.team2} (Loser eliminated)`
  );
  console.log(
    "🔥 Qualifier 2: TBD vs TBD (Generated when Q1 & Eliminator complete)"
  );
  console.log("🏆 Final: TBD vs TBD (Generated when Q1 & Q2 complete)");

  return {
    success: true,
    playoffMatches,
    qualifiedTeams,
  };
}

/**
 * Generates Qualifier 2 and Final after initial league playoff matches
 */
export function generateLeagueFinalMatches(state: TournamentState): {
  success: boolean;
  finalMatches: Match[];
  errors?: string[];
} {
  console.log("\n🏆 Generating league final matches...");

  // Find completed Qualifier 1 and Eliminator
  const qualifier1 = state.matches.find(
    (match) =>
      match.isPlayoff &&
      match.playoffType === "qualifier-1" &&
      match.status === "completed"
  );

  const eliminator = state.matches.find(
    (match) =>
      match.isPlayoff &&
      match.playoffType === "eliminator" &&
      match.status === "completed"
  );

  if (!qualifier1 || !eliminator) {
    return {
      success: false,
      finalMatches: [],
      errors: ["Both Qualifier 1 and Eliminator must be completed first"],
    };
  }

  if (!qualifier1.result || !eliminator.result) {
    return {
      success: false,
      finalMatches: [],
      errors: ["Match results not found for Qualifier 1 or Eliminator"],
    };
  }

  const finalMatches: Match[] = [];

  // Qualifier 2: Loser of Q1 vs Winner of Eliminator
  const qualifier2: Match = {
    id: `Q2-001`,
    team1: qualifier1.result.loser, // Loser of Qualifier 1 (gets second chance)
    team2: eliminator.result.winner, // Winner of Eliminator
    round: 2,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "qualifier-2",
    phase: "playoffs",
  };

  // Final: Winner of Q1 vs Winner of Q2 (to be determined)
  const final: Match = {
    id: `F-001`,
    team1: qualifier1.result.winner, // Winner of Qualifier 1 (direct entry)
    team2: "TBD", // Winner of Qualifier 2
    round: 3,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "final",
    phase: "playoffs",
  };

  finalMatches.push(qualifier2, final);

  console.log(
    "🔥 Qualifier 2:",
    `${qualifier2.team1} vs ${qualifier2.team2} (Winner → Final)`
  );
  console.log("🏆 Final:", `${final.team1} vs Winner of Q2`);

  return {
    success: true,
    finalMatches,
  };
}

/**
 * Updates the final match with Qualifier 2 winner
 */
export function updateLeagueFinalWithQ2Winner(state: TournamentState): {
  success: boolean;
  updatedFinal?: Match;
  errors?: string[];
} {
  console.log("\n🏆 Updating final with Qualifier 2 winner...");

  const qualifier2 = state.matches.find(
    (match) =>
      match.isPlayoff &&
      match.playoffType === "qualifier-2" &&
      match.status === "completed"
  );

  const final = state.matches.find(
    (match) =>
      match.isPlayoff && match.playoffType === "final" && match.team2 === "TBD"
  );

  if (!qualifier2?.result || !final) {
    return {
      success: false,
      errors: ["Qualifier 2 result or final match not found"],
    };
  }

  const updatedFinal: Match = {
    ...final,
    team2: qualifier2.result.winner,
  };

  console.log(
    "🏆 Final updated:",
    `${updatedFinal.team1} vs ${updatedFinal.team2}`
  );

  return {
    success: true,
    updatedFinal,
  };
}

/**
 * Checks if league format qualification rounds are complete
 */
export function canGenerateLeagueQ2(state: TournamentState): {
  canGenerate: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  const qualifier1 = state.matches.find(
    (match) =>
      match.isPlayoff &&
      match.playoffType === "qualifier-1" &&
      match.status === "completed"
  );

  const eliminator = state.matches.find(
    (match) =>
      match.isPlayoff &&
      match.playoffType === "eliminator" &&
      match.status === "completed"
  );

  if (!qualifier1) {
    reasons.push("Qualifier 1 must be completed");
  }

  if (!eliminator) {
    reasons.push("Eliminator must be completed");
  }

  const q2Exists = state.matches.some(
    (match) => match.isPlayoff && match.playoffType === "qualifier-2"
  );

  if (q2Exists) {
    reasons.push("Qualifier 2 already generated");
  }

  return {
    canGenerate: reasons.length === 0,
    reasons,
  };
}

/**
 * Gets the current league playoff phase status
 */
export function getLeaguePlayoffStatus(state: TournamentState): {
  phase:
    | "not-started"
    | "qualification"
    | "qualifier-2"
    | "final-ready"
    | "completed";
  description: string;
  nextAction?: string;
} {
  const qualifier1 = state.matches.find(
    (match) => match.isPlayoff && match.playoffType === "qualifier-1"
  );

  const eliminator = state.matches.find(
    (match) => match.isPlayoff && match.playoffType === "eliminator"
  );

  const qualifier2 = state.matches.find(
    (match) => match.isPlayoff && match.playoffType === "qualifier-2"
  );

  const final = state.matches.find(
    (match) => match.isPlayoff && match.playoffType === "final"
  );

  if (!qualifier1 || !eliminator) {
    return {
      phase: "not-started",
      description: "Ready to generate league playoffs",
      nextAction: "Generate Qualifier 1 and Eliminator",
    };
  }

  const q1Complete = qualifier1.status === "completed";
  const eComplete = eliminator.status === "completed";

  if (!q1Complete || !eComplete) {
    const completed = [q1Complete, eComplete].filter(Boolean).length;
    return {
      phase: "qualification",
      description: `Qualification round in progress (${completed}/2 completed)`,
      nextAction: "Complete remaining qualification matches",
    };
  }

  if (!qualifier2) {
    return {
      phase: "qualification",
      description: "Qualification round completed",
      nextAction: "Generate Qualifier 2 and Final",
    };
  }

  const q2Complete = qualifier2.status === "completed";

  if (!q2Complete) {
    return {
      phase: "qualifier-2",
      description: "Qualifier 2 in progress",
      nextAction: "Complete Qualifier 2",
    };
  }

  if (final?.team2 === "TBD") {
    return {
      phase: "qualifier-2",
      description: "Qualifier 2 completed",
      nextAction: "Update final with Q2 winner",
    };
  }

  const finalComplete = final?.status === "completed";

  if (!finalComplete) {
    return {
      phase: "final-ready",
      description: "Final is ready",
      nextAction: "Complete the final",
    };
  }

  return {
    phase: "completed",
    description: "Tournament completed!",
  };
}
