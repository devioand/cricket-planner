// League-style playoff algorithms (IPL/BBL format)

import type { Match, TournamentState } from "../types";

// Note: Removed old league playoff generation functions
// These are replaced by generateLeaguePlayoffMatchesWithTBD which creates all matches immediately
// with TBD placeholders that get populated automatically when matches complete

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

/**
 * Generates league-style playoff matches with TBD placeholders immediately
 * This function creates playoff matches at tournament start without requiring round robin completion
 */
export function generateLeaguePlayoffMatchesWithTBD(state: TournamentState): {
  success: boolean;
  playoffMatches: Match[];
  qualifiedTeams: string[];
  errors?: string[];
} {
  console.log("\n🏆 Generating league playoffs with TBD placeholders...");

  const teamCount = state.teams.length;

  if (teamCount < 3) {
    return {
      success: false,
      playoffMatches: [],
      qualifiedTeams: [],
      errors: ["At least 3 teams are required for playoffs"],
    };
  }

  const playoffMatches: Match[] = [];

  // Handle 3-team tournament (Simple Final format - League doesn't work with 3 teams)
  if (teamCount === 3) {
    console.log("🎯 3-team tournament - TBD Final format (League fallback)");

    const final: Match = {
      id: `F-001`,
      team1: "TBD", // 1st place (to be determined)
      team2: "TBD", // 2nd place (to be determined)
      round: 1,
      status: "scheduled",
      overs: state.maxOvers,
      maxWickets: state.maxWickets,
      isPlayoff: true,
      playoffType: "final",
      phase: "playoffs",
    };

    playoffMatches.push(final);
    console.log(
      "🏆 Final: TBD vs TBD (Teams will be determined after round robin)"
    );

    return {
      success: true,
      playoffMatches,
      qualifiedTeams: [], // No qualified teams yet - TBD
    };
  }

  // Handle 4+ team tournament (Full League format with TBDs)
  console.log("🎯 4+ team tournament - TBD League format");

  // Qualifier 1: TBD vs TBD (1st vs 2nd when determined)
  const qualifier1: Match = {
    id: `Q1-001`,
    team1: "TBD", // 1st place
    team2: "TBD", // 2nd place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "qualifier-1",
    phase: "playoffs",
  };

  // Eliminator: TBD vs TBD (3rd vs 4th when determined)
  const eliminator: Match = {
    id: `E-001`,
    team1: "TBD", // 3rd place
    team2: "TBD", // 4th place
    round: 1,
    status: "scheduled",
    overs: state.maxOvers,
    maxWickets: state.maxWickets,
    isPlayoff: true,
    playoffType: "eliminator",
    phase: "playoffs",
  };

  // Qualifier 2: TBD vs TBD (Loser Q1 vs Winner Eliminator)
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

  // Final: TBD vs TBD (Winner Q1 vs Winner Q2)
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

  console.log("⚡ Qualifier 1: TBD vs TBD (1st vs 2nd when determined)");
  console.log("💥 Eliminator: TBD vs TBD (3rd vs 4th when determined)");
  console.log("🔥 Qualifier 2: TBD vs TBD (Q1 loser vs Eliminator winner)");
  console.log("🏆 Final: TBD vs TBD (Q1 winner vs Q2 winner)");

  return {
    success: true,
    playoffMatches,
    qualifiedTeams: [], // No qualified teams yet - TBD
  };
}
