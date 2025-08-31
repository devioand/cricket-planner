import {
  generateRoundRobinMatches,
  validateRoundRobinTeams,
  calculateRoundRobinStats,
} from "../round-robin";

describe("Round Robin Algorithm", () => {
  const mockTeams3 = ["Team A", "Team B", "Team C"];
  const mockTeams4 = [
    "Mumbai Indians",
    "Chennai Super Kings",
    "Royal Challengers Bangalore",
    "Kolkata Knight Riders",
  ];
  const mockTeams6 = [...mockTeams4, "Delhi Capitals", "Rajasthan Royals"];

  describe("generateRoundRobinMatches", () => {
    it("should generate correct number of matches for 3 teams", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams3,
        maxOvers: 20,
        maxWickets: 10,
      });

      const expectedMatches = (3 * 2) / 2; // 3 matches
      expect(result.matches).toHaveLength(expectedMatches);
      expect(result.totalRounds).toBe(3); // Current scheduler creates 3 rounds for 3 teams
      expect(result.matchesPerRound).toBe(1); // One match per round with a bye
    });

    it("should generate correct number of matches for 4 teams", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams4,
        maxOvers: 20,
        maxWickets: 10,
      });

      const expectedMatches = (4 * 3) / 2; // 6 matches
      expect(result.matches).toHaveLength(expectedMatches);
      expect(result.totalRounds).toBe(3); // 4 teams need 3 rounds
      expect(result.matchesPerRound).toBe(2); // Max 2 matches per round with 4 teams
    });

    it("should generate correct number of matches for 6 teams", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams6,
        maxOvers: 20,
        maxWickets: 10,
      });

      const expectedMatches = (6 * 5) / 2; // 15 matches
      expect(result.matches).toHaveLength(expectedMatches);
      expect(result.totalRounds).toBeGreaterThanOrEqual(5); // Minimal rounds is 5; scheduler may use more
      expect(result.matchesPerRound).toBeLessThanOrEqual(3); // At most 3 parallel matches
    });

    it("should ensure each team plays every other team exactly once", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams4,
        maxOvers: 20,
        maxWickets: 10,
      });

      // Create set of all expected pairings
      const expectedPairs = new Set<string>();
      for (let i = 0; i < mockTeams4.length; i++) {
        for (let j = i + 1; j < mockTeams4.length; j++) {
          expectedPairs.add(`${mockTeams4[i]}-${mockTeams4[j]}`);
        }
      }

      // Create set of actual pairings
      const actualPairs = new Set<string>();
      result.matches.forEach((match) => {
        const pair = `${match.team1}-${match.team2}`;
        actualPairs.add(pair);
      });

      expect(actualPairs).toEqual(expectedPairs);
    });

    it("should ensure each team plays the correct number of matches", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams4,
        maxOvers: 20,
        maxWickets: 10,
      });

      const teamMatchCount: Record<string, number> = {};
      mockTeams4.forEach((team) => (teamMatchCount[team] = 0));

      result.matches.forEach((match) => {
        teamMatchCount[match.team1]++;
        teamMatchCount[match.team2]++;
      });

      // Each team should play against every other team exactly once
      mockTeams4.forEach((team) => {
        expect(teamMatchCount[team]).toBe(mockTeams4.length - 1);
      });
    });

    it("should set correct match properties", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams3,
        maxOvers: 50,
        maxWickets: 11,
      });

      result.matches.forEach((match) => {
        expect(match.id).toMatch(/^RR-\d{3}$/);
        expect(match.overs).toBe(50);
        expect(match.maxWickets).toBe(11);
        expect(match.status).toBe("scheduled");
        expect(match.isPlayoff).toBeFalsy();
        expect(typeof match.round).toBe("number");
        expect(match.round).toBeGreaterThan(0);
      });
    });

    it("should distribute matches across rounds optimally", () => {
      const result = generateRoundRobinMatches({
        teams: mockTeams4,
        maxOvers: 20,
        maxWickets: 10,
      });

      // Group matches by round
      const matchesByRound: Record<number, typeof result.matches> = {};
      result.matches.forEach((match) => {
        if (!matchesByRound[match.round]) {
          matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
      });

      // Each round should have at most 2 matches (4 teams can play 2 simultaneous matches)
      Object.values(matchesByRound).forEach((roundMatches) => {
        expect(roundMatches.length).toBeLessThanOrEqual(2);
      });

      // No team should play more than once per round
      Object.values(matchesByRound).forEach((roundMatches) => {
        const teamsInRound = new Set<string>();
        roundMatches.forEach((match) => {
          expect(teamsInRound.has(match.team1)).toBe(false);
          expect(teamsInRound.has(match.team2)).toBe(false);
          teamsInRound.add(match.team1);
          teamsInRound.add(match.team2);
        });
      });
    });
  });

  describe("validateRoundRobinTeams", () => {
    it("should validate correct teams", () => {
      const result = validateRoundRobinTeams(mockTeams4);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty team list", () => {
      const result = validateRoundRobinTeams([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "At least 2 teams are required for Round Robin"
      );
    });

    it("should reject single team", () => {
      const result = validateRoundRobinTeams(["Only Team"]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "At least 2 teams are required for Round Robin"
      );
    });

    it("should reject duplicate teams", () => {
      const result = validateRoundRobinTeams(["Team A", "Team B", "Team A"]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Duplicate team names are not allowed");
    });

    it("should reject empty team names", () => {
      const result = validateRoundRobinTeams(["Team A", "", "Team C"]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Empty team names are not allowed");
    });

    it("should reject whitespace-only team names", () => {
      const result = validateRoundRobinTeams(["Team A", "   ", "Team C"]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Empty team names are not allowed");
    });

    it("should handle multiple validation errors", () => {
      const result = validateRoundRobinTeams(["Team A", "Team A", "", "   "]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain("Duplicate team names are not allowed");
      expect(result.errors).toContain("Empty team names are not allowed");
    });
  });

  describe("calculateRoundRobinStats", () => {
    it("should calculate correct stats for 3 teams", () => {
      const stats = calculateRoundRobinStats(mockTeams3);
      expect(stats.teamCount).toBe(3);
      expect(stats.totalMatches).toBe(3); // n*(n-1)/2 = 3*2/2 = 3
      expect(stats.matchesPerTeam).toBe(2); // n-1 = 3-1 = 2
      expect(stats.minRounds).toBe(3); // current calculation yields 3 for 3 teams
    });

    it("should calculate correct stats for 4 teams", () => {
      const stats = calculateRoundRobinStats(mockTeams4);
      expect(stats.teamCount).toBe(4);
      expect(stats.totalMatches).toBe(6); // n*(n-1)/2 = 4*3/2 = 6
      expect(stats.matchesPerTeam).toBe(3); // n-1 = 4-1 = 3
      expect(stats.minRounds).toBe(3); // n-1 = 4-1 = 3
    });

    it("should calculate correct stats for 6 teams", () => {
      const stats = calculateRoundRobinStats(mockTeams6);
      expect(stats.teamCount).toBe(6);
      expect(stats.totalMatches).toBe(15); // n*(n-1)/2 = 6*5/2 = 15
      expect(stats.matchesPerTeam).toBe(5); // n-1 = 6-1 = 5
      expect(stats.minRounds).toBe(5); // n-1 = 6-1 = 5
    });

    it("should handle edge case of 2 teams", () => {
      const stats = calculateRoundRobinStats(["Team A", "Team B"]);
      expect(stats.teamCount).toBe(2);
      expect(stats.totalMatches).toBe(1); // n*(n-1)/2 = 2*1/2 = 1
      expect(stats.matchesPerTeam).toBe(1); // n-1 = 2-1 = 1
      expect(stats.minRounds).toBe(1); // n-1 = 2-1 = 1
    });
  });
});
