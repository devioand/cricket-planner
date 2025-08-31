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
import type {
  Match,
  CricketMatchResult,
  CricketTeamStats,
  InningsScore,
} from "../../types";

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

  describe("Net Run Rate (NRR) Calculations - 1999 World Cup South Africa Example", () => {
    /**
     * This test suite covers the exact scenario from the 1999 Cricket World Cup
     * where South Africa had a Net Run Rate of +1.495 after 3 matches in Group A.
     *
     * The example demonstrates key NRR calculation rules:
     * - Teams bowled out are calculated as if they faced their full quota of overs
     * - NRR = (Runs scored / Overs faced) - (Runs conceded / Overs bowled)
     * - Only completed matches count for NRR calculations
     */

    let southAfricaStats: CricketTeamStats;
    let indiaStats: CricketTeamStats;
    let sriLankaStats: CricketTeamStats;
    let englandStats: CricketTeamStats;

    beforeEach(() => {
      southAfricaStats = initializeTeamStats("South Africa");
      indiaStats = initializeTeamStats("India");
      sriLankaStats = initializeTeamStats("Sri Lanka");
      englandStats = initializeTeamStats("England");
    });

    const createMatch = (
      id: string,
      team1: string,
      team2: string,
      overs: number = 50
    ): Match => ({
      id,
      team1,
      team2,
      round: 1,
      status: "completed",
      overs,
      maxWickets: 10,
      isPlayoff: false,
      phase: "round-robin",
    });

    const createInnings = (
      teamName: string,
      runs: number,
      wickets: number,
      overs: number,
      isAllOut: boolean = false
    ): InningsScore => ({
      teamName,
      runs,
      wickets,
      overs,
      ballsFaced: oversToBalls(overs),
      isAllOut,
      runRate: calculateRunRate(runs, overs),
    });

    it("should calculate NRR correctly for South Africa vs India match", () => {
      // Match 1: South Africa vs India
      // SA: 254/6 in 47.2 overs, India: 253/5 in 50 overs
      const match = createMatch("SA-IND", "South Africa", "India");
      const saInnings = createInnings("South Africa", 254, 6, 47.333, false); // 47.2 overs
      const indInnings = createInnings("India", 253, 5, 50, false);

      const matchResult: CricketMatchResult = {
        winner: "South Africa",
        loser: "India",
        team1Innings: saInnings,
        team2Innings: indInnings,
        marginType: "runs",
        margin: 1,
        matchType: "completed",
      };

      const updatedSA = updateTeamStatsAfterMatch(
        southAfricaStats,
        match,
        matchResult
      );
      const updatedIND = updateTeamStatsAfterMatch(
        indiaStats,
        match,
        matchResult
      );

      // Verify South Africa's stats
      expect(updatedSA.totalRunsScored).toBe(254);
      expect(updatedSA.totalOversPlayed).toBeCloseTo(47.333, 3);
      expect(updatedSA.totalRunsConceded).toBe(253);
      expect(updatedSA.totalOversBowled).toBe(50);
      expect(updatedSA.wins).toBe(1);
      expect(updatedSA.points).toBe(2);

      // Verify India's stats
      expect(updatedIND.totalRunsScored).toBe(253);
      expect(updatedIND.totalOversPlayed).toBe(50);
      expect(updatedIND.totalRunsConceded).toBe(254);
      expect(updatedIND.totalOversBowled).toBeCloseTo(47.333, 3);
      expect(updatedIND.losses).toBe(1);
    });

    it("should handle all-out teams correctly for South Africa vs Sri Lanka", () => {
      // Match 2: South Africa vs Sri Lanka
      // SA: 199/9 in 50 overs, Sri Lanka: 110 all out in 35.2 overs
      const match = createMatch("SA-SL", "South Africa", "Sri Lanka");
      const saInnings = createInnings("South Africa", 199, 9, 50, false);
      const slInnings = createInnings("Sri Lanka", 110, 10, 35.333, true); // All out

      const matchResult: CricketMatchResult = {
        winner: "South Africa",
        loser: "Sri Lanka",
        team1Innings: saInnings,
        team2Innings: slInnings,
        marginType: "runs",
        margin: 89,
        matchType: "completed",
      };

      const updatedSA = updateTeamStatsAfterMatch(
        southAfricaStats,
        match,
        matchResult
      );
      const updatedSL = updateTeamStatsAfterMatch(
        sriLankaStats,
        match,
        matchResult
      );

      // Key NRR rule: Sri Lanka was all out, so their overs should be counted as full 50
      expect(updatedSA.totalRunsConceded).toBe(110);
      expect(updatedSA.totalOversBowled).toBe(50); // Full quota used for all-out team

      expect(updatedSL.totalRunsScored).toBe(110);
      expect(updatedSL.totalOversPlayed).toBe(50); // Full quota used for all-out team
      expect(updatedSL.totalRunsConceded).toBe(199);
      expect(updatedSL.totalOversBowled).toBe(50);
    });

    it("should handle all-out teams correctly for South Africa vs England", () => {
      // Match 3: South Africa vs England
      // SA: 225/7 in 50 overs, England: 103 all out in 41 overs
      const match = createMatch("SA-ENG", "South Africa", "England");
      const saInnings = createInnings("South Africa", 225, 7, 50, false);
      const engInnings = createInnings("England", 103, 10, 41, true); // All out

      const matchResult: CricketMatchResult = {
        winner: "South Africa",
        loser: "England",
        team1Innings: saInnings,
        team2Innings: engInnings,
        marginType: "runs",
        margin: 122,
        matchType: "completed",
      };

      const updatedSA = updateTeamStatsAfterMatch(
        southAfricaStats,
        match,
        matchResult
      );
      const updatedENG = updateTeamStatsAfterMatch(
        englandStats,
        match,
        matchResult
      );

      // England was all out, so their overs should be counted as full 50
      expect(updatedSA.totalRunsConceded).toBe(103);
      expect(updatedSA.totalOversBowled).toBe(50); // Full quota used for all-out team

      expect(updatedENG.totalRunsScored).toBe(103);
      expect(updatedENG.totalOversPlayed).toBe(50); // Full quota used for all-out team
    });

    it("should calculate the exact 1999 World Cup NRR for South Africa after all 3 matches", () => {
      let saStats = initializeTeamStats("South Africa");

      // Match 1: SA vs India - SA: 254/6 (47.2), India: 253/5 (50)
      const match1 = createMatch("SA-IND", "South Africa", "India");
      const saInnings1 = createInnings("South Africa", 254, 6, 47.333, false);
      const indInnings1 = createInnings("India", 253, 5, 50, false);

      const result1: CricketMatchResult = {
        winner: "South Africa",
        loser: "India",
        team1Innings: saInnings1,
        team2Innings: indInnings1,
        marginType: "runs",
        margin: 1,
        matchType: "completed",
      };
      saStats = updateTeamStatsAfterMatch(saStats, match1, result1);

      // Match 2: SA vs Sri Lanka - SA: 199/9 (50), Sri Lanka: 110 all out (35.2)
      const match2 = createMatch("SA-SL", "South Africa", "Sri Lanka");
      const saInnings2 = createInnings("South Africa", 199, 9, 50, false);
      const slInnings2 = createInnings("Sri Lanka", 110, 10, 35.333, true);

      const result2: CricketMatchResult = {
        winner: "South Africa",
        loser: "Sri Lanka",
        team1Innings: saInnings2,
        team2Innings: slInnings2,
        marginType: "runs",
        margin: 89,
        matchType: "completed",
      };
      saStats = updateTeamStatsAfterMatch(saStats, match2, result2);

      // Match 3: SA vs England - SA: 225/7 (50), England: 103 all out (41)
      const match3 = createMatch("SA-ENG", "South Africa", "England");
      const saInnings3 = createInnings("South Africa", 225, 7, 50, false);
      const engInnings3 = createInnings("England", 103, 10, 41, true);

      const result3: CricketMatchResult = {
        winner: "South Africa",
        loser: "England",
        team1Innings: saInnings3,
        team2Innings: engInnings3,
        marginType: "runs",
        margin: 122,
        matchType: "completed",
      };
      saStats = updateTeamStatsAfterMatch(saStats, match3, result3);

      // Verify the final accumulated stats match the 1999 World Cup table
      expect(saStats.totalRunsScored).toBe(678); // 254 + 199 + 225
      expect(saStats.totalOversPlayed).toBeCloseTo(147.333, 3); // 47.333 + 50 + 50
      expect(saStats.totalRunsConceded).toBe(466); // 253 + 110 + 103
      expect(saStats.totalOversBowled).toBe(150); // 50 + 50 + 50 (all opponents get full quota)

      // Verify the exact NRR calculation from the example
      const battingRate = 678 / 147.333; // ≈ 4.602 rpo
      const bowlingRate = 466 / 150; // ≈ 3.107 rpo
      const expectedNRR = battingRate - bowlingRate; // ≈ +1.495

      expect(battingRate).toBeCloseTo(4.602, 3);
      expect(bowlingRate).toBeCloseTo(3.107, 3);
      expect(expectedNRR).toBeCloseTo(1.495, 3);
      expect(saStats.netRunRate).toBeCloseTo(1.495, 3);

      // Verify match statistics
      expect(saStats.matchesPlayed).toBe(3);
      expect(saStats.wins).toBe(3);
      expect(saStats.losses).toBe(0);
      expect(saStats.points).toBe(6);
    });

    it("should demonstrate all-out team NRR calculation rule with a clear example", () => {
      // Team A scores 200/8 in 50 overs, Team B all out for 150 in 30 overs
      const match = createMatch("A-B", "Team A", "Team B");
      const teamAInnings = createInnings("Team A", 200, 8, 50, false);
      const teamBInnings = createInnings("Team B", 150, 10, 30, true);

      const matchResult: CricketMatchResult = {
        winner: "Team A",
        loser: "Team B",
        team1Innings: teamAInnings,
        team2Innings: teamBInnings,
        marginType: "runs",
        margin: 50,
        matchType: "completed",
      };

      let teamAStats = initializeTeamStats("Team A");
      teamAStats = updateTeamStatsAfterMatch(teamAStats, match, matchResult);

      // Team A's bowling: 150 runs conceded in 50 overs (not 30) = 3.0 rpo
      // Team B was all out, so we use full 50 overs for NRR calculation
      expect(teamAStats.totalRunsConceded).toBe(150);
      expect(teamAStats.totalOversBowled).toBe(50); // Full quota, not actual 30
      expect(teamAStats.bowlingRunRate).toBeCloseTo(3.0, 1);

      // Team A's batting: 200 runs in 50 overs = 4.0 rpo
      expect(teamAStats.totalRunsScored).toBe(200);
      expect(teamAStats.totalOversPlayed).toBe(50);
      expect(teamAStats.battingRunRate).toBeCloseTo(4.0, 1);

      // NRR = 4.0 - 3.0 = +1.0
      expect(teamAStats.netRunRate).toBeCloseTo(1.0, 1);
    });

    it("should not count playoff matches for NRR calculation", () => {
      // Create a playoff match
      const playoffMatch: Match = {
        id: "FINAL",
        team1: "Team A",
        team2: "Team B",
        round: 1,
        status: "completed",
        overs: 50,
        maxWickets: 10,
        isPlayoff: true,
        playoffType: "final",
        phase: "playoffs",
      };

      const teamAInnings = createInnings("Team A", 180, 7, 50, false);
      const teamBInnings = createInnings("Team B", 175, 9, 50, false);

      const matchResult: CricketMatchResult = {
        winner: "Team A",
        loser: "Team B",
        team1Innings: teamAInnings,
        team2Innings: teamBInnings,
        marginType: "runs",
        margin: 5,
        matchType: "completed",
      };

      const teamAStats = initializeTeamStats("Team A");
      const updatedStats = updateTeamStatsAfterMatch(
        teamAStats,
        playoffMatch,
        matchResult
      );

      // Stats should remain unchanged for playoff matches
      expect(updatedStats.totalRunsScored).toBe(0);
      expect(updatedStats.totalOversPlayed).toBe(0);
      expect(updatedStats.totalRunsConceded).toBe(0);
      expect(updatedStats.totalOversBowled).toBe(0);
      expect(updatedStats.netRunRate).toBe(0);
      expect(updatedStats.matchesPlayed).toBe(0);
    });

    it("should handle edge cases in NRR calculations", () => {
      // Test with very small overs (e.g., rain-affected match)
      const match = createMatch("RAIN", "Team A", "Team B", 10); // 10 over match
      const teamAInnings = createInnings("Team A", 80, 3, 10, false);
      const teamBInnings = createInnings("Team B", 85, 4, 9.5, false);

      const matchResult: CricketMatchResult = {
        winner: "Team B",
        loser: "Team A",
        team1Innings: teamAInnings,
        team2Innings: teamBInnings,
        marginType: "wickets",
        margin: 6,
        matchType: "completed",
      };

      let teamAStats = initializeTeamStats("Team A");
      teamAStats = updateTeamStatsAfterMatch(teamAStats, match, matchResult);

      // Verify calculations work for reduced overs matches
      expect(teamAStats.totalRunsScored).toBe(80);
      expect(teamAStats.totalOversPlayed).toBe(10);
      expect(teamAStats.totalRunsConceded).toBe(85);
      expect(teamAStats.totalOversBowled).toBeCloseTo(9.5, 1);

      // Run rates should be calculated correctly
      expect(teamAStats.battingRunRate).toBeCloseTo(8.0, 1); // 80/10
      expect(teamAStats.bowlingRunRate).toBeCloseTo(8.95, 2); // 85/9.5
      expect(teamAStats.netRunRate).toBeCloseTo(-0.947, 2); // 8.0 - 8.95
    });
  });
});
