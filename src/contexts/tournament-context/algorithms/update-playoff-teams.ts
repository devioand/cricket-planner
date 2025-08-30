// Utility functions to update playoff matches when prerequisite matches are completed

import type { Match, TournamentState } from "../types";

/**
 * Updates league playoff matches with actual team names when prerequisites are completed
 */
export function updateLeaguePlayoffTeams(state: TournamentState): {
  success: boolean;
  updatedMatches: Match[];
  updates: string[];
} {
  const updates: string[] = [];
  const updatedMatches = [...state.matches];

  // Find playoff matches
  const qualifier1 = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "qualifier-1"
  );
  const eliminator = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "eliminator"
  );
  const qualifier2 = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "qualifier-2"
  );
  const final = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "final"
  );

  // Update Qualifier 2 team1 when Q1 completes (Q1 loser gets second chance)
  if (
    qualifier1?.status === "completed" &&
    qualifier2 &&
    qualifier2.team1 === "TBD"
  ) {
    if (qualifier1.result) {
      const q2Index = updatedMatches.findIndex((m) => m.id === qualifier2.id);
      if (q2Index !== -1) {
        updatedMatches[q2Index] = {
          ...qualifier2,
          team1: qualifier1.result.loser, // Q1 loser gets second chance
        };
        updates.push(
          `🔥 Qualifier 2 team1 updated: ${qualifier1.result.loser} (Q1 loser)`
        );
      }
    }
  }

  // Update Qualifier 2 team2 when Eliminator completes
  if (
    eliminator?.status === "completed" &&
    qualifier2 &&
    qualifier2.team2 === "TBD"
  ) {
    if (eliminator.result) {
      const q2Index = updatedMatches.findIndex((m) => m.id === qualifier2.id);
      if (q2Index !== -1) {
        updatedMatches[q2Index] = {
          ...updatedMatches[q2Index], // Use updated version from above
          team2: eliminator.result.winner, // Eliminator winner advances
        };
        updates.push(
          `🔥 Qualifier 2 team2 updated: ${eliminator.result.winner} (Eliminator winner)`
        );
      }
    }
  }

  // Update Final if Q1 is completed (team1) and Q2 is completed (team2)
  if (qualifier1?.status === "completed" && final && final.team1 === "TBD") {
    if (qualifier1.result) {
      const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
      if (finalIndex !== -1) {
        updatedMatches[finalIndex] = {
          ...final,
          team1: qualifier1.result.winner, // Q1 winner gets direct entry to final
        };
        updates.push(`🏆 Final team1 updated: ${qualifier1.result.winner}`);
      }
    }
  }

  // Update Final team2 if Q2 is completed
  const updatedQ2 = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "qualifier-2"
  );
  if (updatedQ2?.status === "completed" && final && final.team2 === "TBD") {
    if (updatedQ2.result) {
      const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
      if (finalIndex !== -1) {
        updatedMatches[finalIndex] = {
          ...updatedMatches[finalIndex],
          team2: updatedQ2.result.winner, // Q2 winner advances to final
        };
        updates.push(`🏆 Final team2 updated: ${updatedQ2.result.winner}`);
      }
    }
  }

  return {
    success: updates.length > 0,
    updatedMatches,
    updates,
  };
}

/**
 * Updates world cup playoff matches with actual team names when prerequisites are completed
 */
export function updateWorldCupPlayoffTeams(state: TournamentState): {
  success: boolean;
  updatedMatches: Match[];
  updates: string[];
} {
  const updates: string[] = [];
  const updatedMatches = [...state.matches];

  // Find playoff matches
  const semiFinal1 = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "semi-final-1"
  );
  const semiFinal2 = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "semi-final-2"
  );
  const final = updatedMatches.find(
    (m) => m.isPlayoff && m.playoffType === "final"
  );

  // Update Final team1 when Semi-final 1 completes
  if (semiFinal1?.status === "completed" && final && final.team1 === "TBD") {
    if (semiFinal1.result) {
      const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
      if (finalIndex !== -1) {
        updatedMatches[finalIndex] = {
          ...final,
          team1: semiFinal1.result.winner, // SF1 winner
        };
        updates.push(
          `🏆 Final team1 updated: ${semiFinal1.result.winner} (SF1 winner)`
        );
      }
    }
  }

  // Update Final team2 when Semi-final 2 completes
  if (semiFinal2?.status === "completed" && final && final.team2 === "TBD") {
    if (semiFinal2.result) {
      const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
      if (finalIndex !== -1) {
        // Get the potentially updated final from previous operation
        const currentFinal = updatedMatches[finalIndex];
        updatedMatches[finalIndex] = {
          ...currentFinal,
          team2: semiFinal2.result.winner, // SF2 winner
        };
        updates.push(
          `🏆 Final team2 updated: ${semiFinal2.result.winner} (SF2 winner)`
        );
      }
    }
  }

  // Log complete final matchup when both teams are set
  if (
    semiFinal1?.status === "completed" &&
    semiFinal2?.status === "completed" &&
    semiFinal1.result &&
    semiFinal2.result &&
    final
  ) {
    const updatedFinal = updatedMatches.find((m) => m.id === final.id);
    if (
      updatedFinal &&
      updatedFinal.team1 !== "TBD" &&
      updatedFinal.team2 !== "TBD"
    ) {
      updates.push(
        `🎉 Final matchup complete: ${updatedFinal.team1} vs ${updatedFinal.team2}`
      );
    }
  }

  return {
    success: updates.length > 0,
    updatedMatches,
    updates,
  };
}

/**
 * Checks if a match has TBD teams that can be resolved
 */
export function hasResolvableTBDTeams(state: TournamentState): boolean {
  if (state.playoffFormat === "league") {
    const q1 = state.matches.find(
      (m) => m.isPlayoff && m.playoffType === "qualifier-1"
    );
    const eliminator = state.matches.find(
      (m) => m.isPlayoff && m.playoffType === "eliminator"
    );
    const q2 = state.matches.find(
      (m) => m.isPlayoff && m.playoffType === "qualifier-2"
    );
    const final = state.matches.find(
      (m) => m.isPlayoff && m.playoffType === "final"
    );

    // Check if Q2 team1 can be resolved (Q1 completed)
    if (q2 && q2.team1 === "TBD" && q1?.status === "completed") {
      return true;
    }

    // Check if Q2 team2 can be resolved (Eliminator completed)
    if (q2 && q2.team2 === "TBD" && eliminator?.status === "completed") {
      return true;
    }

    // Check if Final team1 can be resolved (Q1 completed)
    if (final && final.team1 === "TBD" && q1?.status === "completed") {
      return true;
    }

    // Check if Final team2 can be resolved (Q2 completed)
    if (final && final.team2 === "TBD" && q2?.status === "completed") {
      return true;
    }
  } else if (state.playoffFormat === "world-cup") {
    const final = state.matches.find(
      (m) => m.isPlayoff && m.playoffType === "final"
    );

    // Check if Final can be resolved
    if (final && final.team1 === "TBD") {
      const sf1 = state.matches.find(
        (m) => m.isPlayoff && m.playoffType === "semi-final-1"
      );
      const sf2 = state.matches.find(
        (m) => m.isPlayoff && m.playoffType === "semi-final-2"
      );
      if (sf1?.status === "completed" && sf2?.status === "completed") {
        return true;
      }
    }
  }

  return false;
}

/**
 * Updates initial playoff team assignments from round robin standings
 * This is used to populate TBD playoff matches with actual team names once round robin is complete
 */
export function updateInitialPlayoffTeamsFromStandings(
  state: TournamentState,
  standings: { teamName: string }[]
): {
  success: boolean;
  updatedMatches: Match[];
  updates: string[];
} {
  const updates: string[] = [];
  const updatedMatches = [...state.matches];

  if (state.playoffFormat === "world-cup") {
    // World Cup format: Update semi-finals and finals with TBD
    if (standings.length === 3) {
      // 3-team tournament: Direct final
      const final = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );
      if (final && final.team1 === "TBD" && final.team2 === "TBD") {
        const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
        if (finalIndex !== -1) {
          updatedMatches[finalIndex] = {
            ...final,
            team1: standings[0].teamName, // 1st place
            team2: standings[1].teamName, // 2nd place
          };
          updates.push(
            `🏆 Final teams set: ${standings[0].teamName} vs ${standings[1].teamName}`
          );
        }
      }
    } else if (standings.length >= 4) {
      // 4+ team tournament: Semi-finals
      const semiFinal1 = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "semi-final-1"
      );
      const semiFinal2 = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "semi-final-2"
      );

      if (
        semiFinal1 &&
        semiFinal1.team1 === "TBD" &&
        semiFinal1.team2 === "TBD"
      ) {
        const sf1Index = updatedMatches.findIndex(
          (m) => m.id === semiFinal1.id
        );
        if (sf1Index !== -1) {
          updatedMatches[sf1Index] = {
            ...semiFinal1,
            team1: standings[0].teamName, // 1st place
            team2: standings[3].teamName, // 4th place
          };
          updates.push(
            `⚡ Semi-final 1 teams set: ${standings[0].teamName} vs ${standings[3].teamName}`
          );
        }
      }

      if (
        semiFinal2 &&
        semiFinal2.team1 === "TBD" &&
        semiFinal2.team2 === "TBD"
      ) {
        const sf2Index = updatedMatches.findIndex(
          (m) => m.id === semiFinal2.id
        );
        if (sf2Index !== -1) {
          updatedMatches[sf2Index] = {
            ...semiFinal2,
            team1: standings[1].teamName, // 2nd place
            team2: standings[2].teamName, // 3rd place
          };
          updates.push(
            `⚡ Semi-final 2 teams set: ${standings[1].teamName} vs ${standings[2].teamName}`
          );
        }
      }
    }
  } else if (state.playoffFormat === "league") {
    // League format: Update Qualifier 1 and Eliminator
    if (standings.length === 3) {
      // 3-team tournament: Direct final
      const final = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "final"
      );
      if (final && final.team1 === "TBD" && final.team2 === "TBD") {
        const finalIndex = updatedMatches.findIndex((m) => m.id === final.id);
        if (finalIndex !== -1) {
          updatedMatches[finalIndex] = {
            ...final,
            team1: standings[0].teamName, // 1st place
            team2: standings[1].teamName, // 2nd place
          };
          updates.push(
            `🏆 Final teams set: ${standings[0].teamName} vs ${standings[1].teamName}`
          );
        }
      }
    } else if (standings.length >= 4) {
      // 4+ team tournament: Qualifier 1 and Eliminator
      const qualifier1 = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "qualifier-1"
      );
      const eliminator = updatedMatches.find(
        (m) => m.isPlayoff && m.playoffType === "eliminator"
      );

      if (
        qualifier1 &&
        qualifier1.team1 === "TBD" &&
        qualifier1.team2 === "TBD"
      ) {
        const q1Index = updatedMatches.findIndex((m) => m.id === qualifier1.id);
        if (q1Index !== -1) {
          updatedMatches[q1Index] = {
            ...qualifier1,
            team1: standings[0].teamName, // 1st place
            team2: standings[1].teamName, // 2nd place
          };
          updates.push(
            `⚡ Qualifier 1 teams set: ${standings[0].teamName} vs ${standings[1].teamName}`
          );
        }
      }

      if (
        eliminator &&
        eliminator.team1 === "TBD" &&
        eliminator.team2 === "TBD"
      ) {
        const eIndex = updatedMatches.findIndex((m) => m.id === eliminator.id);
        if (eIndex !== -1) {
          updatedMatches[eIndex] = {
            ...eliminator,
            team1: standings[2].teamName, // 3rd place
            team2: standings[3].teamName, // 4th place
          };
          updates.push(
            `💥 Eliminator teams set: ${standings[2].teamName} vs ${standings[3].teamName}`
          );
        }
      }
    }
  }

  return {
    success: updates.length > 0,
    updatedMatches,
    updates,
  };
}
