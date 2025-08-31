import {
  initializeTeamStats,
  updateTeamStatsAfterMatch,
  getTournamentStandings,
  createSampleMatchResult,
  oversToBalls,
  ballsToOvers,
  calculateRunRate,
  formatNRR,
} from "../cricket-stats";
import type { Match, CricketMatchResult, CricketTeamStats } from "../../types";

describe("Cricket Stats Module", () => {
  describe("oversToBalls and ballsToOvers", () => {
    it("should convert overs to balls correctly", () => {
      expect(oversToBalls(5.0)).toBe(30);
      expect(oversToBalls(5.1)).toBe(31);
      expect(oversToBalls(5.2)).toBe(32);
      expect(oversToBalls(5.3)).toBe(33);
      expect(oversToBalls(5.4)).toBe(34);
      expect(oversToBalls(5.5)).toBe(35);
      expect(oversToBalls(6.0)).toBe(36);
      expect(oversToBalls(20.4)).toBe(124);
    });

    it("should convert balls to overs correctly", () => {
      expect(ballsToOvers(30)).toBe(5.0);
      expect(ballsToOvers(31)).toBe(5.1);
      expect(ballsToOvers(32)).toBe(5.2);
      expect(ballsToOvers(35)).toBe(5.5);
      expect(ballsToOvers(36)).toBe(6.0);
      expect(ballsToOvers(124)).toBe(20.4);
    });

    it("should handle edge cases for overs conversion", () => {
      expect(oversToBalls(0)).toBe(0);
      expect(ballsToOvers(0)).toBe(0);
      expect(oversToBalls(0.1)).toBe(1);
      expect(ballsToOvers(1)).toBe(0.1);
    });
  });

  describe("calculateRunRate", () => {
    it("should calculate run rate correctly", () => {
      expect(calculateRunRate(150, 20.0)).toBe(7.5);
      expect(calculateRunRate(100, 10.0)).toBe(10.0);
      expect(calculateRunRate(75, 15.3)).toBeCloseTo(4.9, 1);
    });

    it("should handle zero overs", () => {
      expect(calculateRunRate(0, 0)).toBe(0);
      expect(calculateRunRate(50, 0)).toBe(0);
    });
  });

  describe("formatNRR", () => {
    it("should format positive NRR correctly", () => {
      expect(formatNRR(1.234)).toBe("+1.23");
      expect(formatNRR(0.567)).toBe("+0.57");
      expect(formatNRR(0.001)).toBe("+0.00");
    });

    it("should format negative NRR correctly", () => {
      expect(formatNRR(-1.234)).toBe("-1.23");
      expect(formatNRR(-0.567)).toBe("-0.57");
      expect(formatNRR(-0.001)).toBe("-0.00");
    });

    it("should format zero NRR correctly", () => {
      expect(formatNRR(0)).toBe("+0.00");
      expect(formatNRR(-0)).toBe("+0.00");
    });
  });

  describe("initializeTeamStats", () => {
    it("should create correct initial stats for a team", () => {
      const stats = initializeTeamStats("Mumbai Indians");

      expect(stats.teamName).toBe("Mumbai Indians");
      expect(stats.matchesPlayed).toBe(0);
      expect(stats.wins).toBe(0);
      expect(stats.losses).toBe(0);
      expect(stats.draws).toBe(0);
      expect(stats.noResults).toBe(0);
      expect(stats.points).toBe(0);
      expect(stats.totalRunsScored).toBe(0);
      expect(stats.totalBallsFaced).toBe(0);
      expect(stats.totalOversPlayed).toBe(0);
      expect(stats.totalRunsConceded).toBe(0);
      expect(stats.totalBallsBowled).toBe(0);
      expect(stats.totalOversBowled).toBe(0);
      expect(stats.battingRunRate).toBe(0);
      expect(stats.bowlingRunRate).toBe(0);
      expect(stats.netRunRate).toBe(0);
    });
  });

  describe("createSampleMatchResult", () => {
    it("should create correct match result for team1 win", () => {
      const result = createSampleMatchResult(
        "Team A",
        "Team B",
        150,
        5,
        20.0,
        140,
        8,
        19.2,
        20
      );

      expect(result.winner).toBe("Team A");
      expect(result.loser).toBe("Team B");
      expect(result.marginType).toBe("runs");
      expect(result.margin).toBe(10);
      expect(result.isDraw).toBeFalsy();
      expect(result.matchType).toBe("completed");

      expect(result.team1Innings?.runs).toBe(150);
      expect(result.team1Innings?.wickets).toBe(5);
      expect(result.team1Innings?.overs).toBe(20.0);
      expect(result.team1Innings?.runRate).toBe(7.5);

      expect(result.team2Innings?.runs).toBe(140);
      expect(result.team2Innings?.wickets).toBe(8);
      expect(result.team2Innings?.overs).toBe(19.2);
      expect(result.team2Innings?.runRate).toBeCloseTo(7.29, 2);
    });

    it("should create correct match result for team2 win", () => {
      const result = createSampleMatchResult(
        "Team A",
        "Team B",
        140,
        8,
        20.0,
        145,
        6,
        18.4,
        20
      );

      expect(result.winner).toBe("Team B");
      expect(result.loser).toBe("Team A");
      expect(result.marginType).toBe("wickets");
      expect(result.margin).toBe(4); // 10 - 6 wickets
    });

    it("should create correct match result for tie", () => {
      const result = createSampleMatchResult(
        "Team A",
        "Team B",
        150,
        6,
        20.0,
        150,
        8,
        20.0,
        20
      );

      expect(result.winner).toBe("");
      expect(result.loser).toBe("");
      expect(result.isDraw).toBe(true);
      expect(result.marginType).toBe("runs");
      expect(result.margin).toBe(0);
    });
  });

  describe("updateTeamStatsAfterMatch", () => {
    const createMockMatch = (): Match => ({
      id: "M-001",
      team1: "Team A",
      team2: "Team B",
      round: 1,
      status: "completed",
      overs: 20,
      maxWickets: 10,
      isPlayoff: false,
      phase: "round-robin",
    });

    const createMockResult = (
      winner: string,
      loser: string,
      team1Runs: number,
      team1Wickets: number,
      team2Runs: number,
      team2Wickets: number
    ): CricketMatchResult => ({
      winner,
      loser,
      team1Innings: {
        teamName: "Team A",
        runs: team1Runs,
        wickets: team1Wickets,
        overs: 20.0,
        ballsFaced: 120,
        isAllOut: team1Wickets >= 10,
        runRate: team1Runs / 20.0,
      },
      team2Innings: {
        teamName: "Team B",
        runs: team2Runs,
        wickets: team2Wickets,
        overs: 20.0,
        ballsFaced: 120,
        isAllOut: team2Wickets >= 10,
        runRate: team2Runs / 20.0,
      },
      marginType: team1Runs > team2Runs ? "runs" : "wickets",
      margin: Math.abs(team1Runs - team2Runs),
      matchType: "completed",
    });

    it("should update winning team stats correctly", () => {
      const initialStats = initializeTeamStats("Team A");
      const match = createMockMatch();
      const result = createMockResult("Team A", "Team B", 150, 5, 140, 8);

      const updatedStats = updateTeamStatsAfterMatch(
        initialStats,
        match,
        result
      );

      expect(updatedStats.matchesPlayed).toBe(1);
      expect(updatedStats.wins).toBe(1);
      expect(updatedStats.losses).toBe(0);
      expect(updatedStats.points).toBe(2); // 2 points for a win
      expect(updatedStats.totalRunsScored).toBe(150);
      expect(updatedStats.totalRunsConceded).toBe(140);
      expect(updatedStats.battingRunRate).toBe(7.5);
      expect(updatedStats.bowlingRunRate).toBe(7.0);
      expect(updatedStats.netRunRate).toBe(0.5);
    });

    it("should update losing team stats correctly", () => {
      const initialStats = initializeTeamStats("Team B");
      const match = createMockMatch();
      const result = createMockResult("Team A", "Team B", 150, 5, 140, 8);

      const updatedStats = updateTeamStatsAfterMatch(
        initialStats,
        match,
        result
      );

      expect(updatedStats.matchesPlayed).toBe(1);
      expect(updatedStats.wins).toBe(0);
      expect(updatedStats.losses).toBe(1);
      expect(updatedStats.points).toBe(0); // 0 points for a loss
      expect(updatedStats.totalRunsScored).toBe(140);
      expect(updatedStats.totalRunsConceded).toBe(150);
      expect(updatedStats.battingRunRate).toBe(7.0);
      expect(updatedStats.bowlingRunRate).toBe(7.5);
      expect(updatedStats.netRunRate).toBe(-0.5);
    });

    it("should update draw stats correctly", () => {
      const initialStats = initializeTeamStats("Team A");
      const match = createMockMatch();
      const result = createMockResult("", "", 150, 6, 150, 8);
      result.isDraw = true;

      const updatedStats = updateTeamStatsAfterMatch(
        initialStats,
        match,
        result
      );

      expect(updatedStats.matchesPlayed).toBe(1);
      expect(updatedStats.wins).toBe(0);
      expect(updatedStats.losses).toBe(0);
      expect(updatedStats.draws).toBe(1);
      expect(updatedStats.points).toBe(1); // 1 point for a draw
      expect(updatedStats.netRunRate).toBe(0); // Same runs scored and conceded
    });

    it("should accumulate stats over multiple matches", () => {
      let stats = initializeTeamStats("Team A");
      const match = createMockMatch();

      // First match: Win
      const result1 = createMockResult("Team A", "Team B", 160, 4, 150, 7);
      stats = updateTeamStatsAfterMatch(stats, match, result1);

      // Second match: Loss
      const result2 = createMockResult("Team B", "Team A", 140, 8, 180, 3);
      stats = updateTeamStatsAfterMatch(stats, match, result2);

      expect(stats.matchesPlayed).toBe(2);
      expect(stats.wins).toBe(1);
      expect(stats.losses).toBe(1);
      expect(stats.points).toBe(2); // 2 for win + 0 for loss
      expect(stats.totalRunsScored).toBe(300); // 160 + 140
      expect(stats.totalRunsConceded).toBe(330); // 150 + 180
    });

    it("should track highest and lowest scores", () => {
      let stats = initializeTeamStats("Team A");
      const match = createMockMatch();

      // First match: 160 runs
      const result1 = createMockResult("Team A", "Team B", 160, 4, 150, 7);
      stats = updateTeamStatsAfterMatch(stats, match, result1);

      expect(stats.highestScore).toBe(160);
      expect(stats.lowestScore).toBe(160);

      // Second match: 180 runs (new highest)
      const result2 = createMockResult("Team A", "Team B", 180, 3, 170, 6);
      stats = updateTeamStatsAfterMatch(stats, match, result2);

      expect(stats.highestScore).toBe(180);
      expect(stats.lowestScore).toBe(160);

      // Third match: 120 runs (new lowest)
      const result3 = createMockResult("Team B", "Team A", 120, 8, 130, 6);
      stats = updateTeamStatsAfterMatch(stats, match, result3);

      expect(stats.highestScore).toBe(180);
      expect(stats.lowestScore).toBe(120);
    });
  });

  describe("getTournamentStandings", () => {
    const createTeamStats = (
      name: string,
      wins: number,
      losses: number,
      draws: number,
      runsScored: number,
      runsConceded: number,
      overs: number = 20
    ): CricketTeamStats => {
      const matchesPlayed = wins + losses + draws;
      const points = wins * 2 + draws * 1;
      const battingRunRate = runsScored / overs;
      const bowlingRunRate = runsConceded / overs;
      const netRunRate = battingRunRate - bowlingRunRate;

      return {
        teamName: name,
        matchesPlayed,
        wins,
        losses,
        draws,
        noResults: 0,
        points,
        totalRunsScored: runsScored,
        totalBallsFaced: overs * 6,
        totalOversPlayed: overs,
        totalRunsConceded: runsConceded,
        totalBallsBowled: overs * 6,
        totalOversBowled: overs,
        battingRunRate,
        bowlingRunRate,
        netRunRate,
        highestScore: runsScored,
        lowestScore: runsScored,
      };
    };

    it("should sort teams by points (descending)", () => {
      const teamStats = {
        "Team A": createTeamStats("Team A", 2, 1, 0, 450, 420, 60), // 4 points
        "Team B": createTeamStats("Team B", 3, 0, 0, 480, 390, 60), // 6 points
        "Team C": createTeamStats("Team C", 1, 2, 0, 360, 450, 60), // 2 points
      };

      const standings = getTournamentStandings(teamStats);

      expect(standings[0].teamName).toBe("Team B"); // 6 points
      expect(standings[1].teamName).toBe("Team A"); // 4 points
      expect(standings[2].teamName).toBe("Team C"); // 2 points
    });

    it("should use NRR as tiebreaker when points are equal", () => {
      const teamStats = {
        "Team A": createTeamStats("Team A", 2, 1, 0, 450, 400, 60), // 4 points, NRR: +0.833
        "Team B": createTeamStats("Team B", 2, 1, 0, 420, 400, 60), // 4 points, NRR: +0.333
        "Team C": createTeamStats("Team C", 2, 1, 0, 450, 480, 60), // 4 points, NRR: -0.5
      };

      const standings = getTournamentStandings(teamStats);

      expect(standings[0].teamName).toBe("Team A"); // Best NRR
      expect(standings[1].teamName).toBe("Team B"); // Second best NRR
      expect(standings[2].teamName).toBe("Team C"); // Worst NRR
    });

    it("should use wins as secondary tiebreaker when points and NRR are equal", () => {
      const teamStats = {
        "Team A": createTeamStats("Team A", 2, 1, 0, 450, 450, 60), // 4 points, NRR: 0, 2 wins
        "Team B": createTeamStats("Team B", 1, 1, 2, 450, 450, 60), // 4 points, NRR: 0, 1 win
      };

      const standings = getTournamentStandings(teamStats);

      expect(standings[0].teamName).toBe("Team A"); // More wins
      expect(standings[1].teamName).toBe("Team B"); // Fewer wins
    });

    it("should handle teams with no matches played", () => {
      const teamStats = {
        "Team A": createTeamStats("Team A", 2, 1, 0, 450, 420, 60),
        "Team B": initializeTeamStats("Team B"), // No matches played
      };

      const standings = getTournamentStandings(teamStats);

      expect(standings[0].teamName).toBe("Team A");
      expect(standings[1].teamName).toBe("Team B");
      expect(standings[1].points).toBe(0);
      expect(standings[1].netRunRate).toBe(0);
    });

    it("should handle large dataset correctly", () => {
      const teamStats: Record<string, CricketTeamStats> = {};

      // Create 8 teams with different performance levels
      for (let i = 1; i <= 8; i++) {
        const teamName = `Team ${String.fromCharCode(64 + i)}`; // Team A, Team B, etc.
        const wins = Math.floor(Math.random() * 4) + 1; // 1-4 wins
        const losses = Math.floor(Math.random() * 3) + 1; // 1-3 losses
        const matchesPlayed = wins + losses;
        const runsScored = 150 * matchesPlayed;
        const runsConceded = Math.max(
          50 * matchesPlayed,
          runsScored - (Math.random() * 100 - 50)
        );

        teamStats[teamName] = createTeamStats(
          teamName,
          wins,
          losses,
          0,
          runsScored,
          runsConceded,
          matchesPlayed * 20
        );
      }

      const standings = getTournamentStandings(teamStats);

      expect(standings).toHaveLength(8);

      // Verify standings are properly sorted (points descending, then NRR descending)
      for (let i = 1; i < standings.length; i++) {
        if (standings[i - 1].points === standings[i].points) {
          expect(standings[i - 1].netRunRate).toBeGreaterThanOrEqual(
            standings[i].netRunRate
          );
        } else {
          expect(standings[i - 1].points).toBeGreaterThan(standings[i].points);
        }
      }
    });
  });
});
