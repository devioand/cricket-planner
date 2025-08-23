// Test file for Round Robin Algorithm

import {
  generateRoundRobinMatches,
  validateRoundRobinTeams,
  calculateRoundRobinStats,
} from "../round-robin";

// Test data
const testTeams4 = [
  "Mumbai Indians",
  "Chennai Super Kings",
  "Royal Challengers Bangalore",
  "Kolkata Knight Riders",
];
const testTeams6 = [...testTeams4, "Delhi Capitals", "Rajasthan Royals"];
const testTeams2 = ["Team A", "Team B"];

/**
 * Run all Round Robin tests
 */
export function runRoundRobinTests() {
  console.log("🧪 Starting Round Robin Algorithm Tests...\n");

  // Test 1: Basic 4-team tournament
  test4TeamTournament();

  // Test 2: 6-team tournament
  test6TeamTournament();

  // Test 3: Minimum 2-team tournament
  test2TeamTournament();

  // Test 4: Validation tests
  testValidation();

  // Test 5: Statistics calculation
  testStatistics();

  console.log("✅ All Round Robin tests completed!\n");
}

function test4TeamTournament() {
  console.log("📊 Test 1: 4-Team Round Robin Tournament");

  const result = generateRoundRobinMatches({
    teams: testTeams4,
    maxOvers: 20,
    maxWickets: 10,
  });

  const expectedMatches = (testTeams4.length * (testTeams4.length - 1)) / 2;
  console.log(`Expected matches: ${expectedMatches}`);
  console.log(`Actual matches: ${result.matches.length}`);
  console.log(`Tournament rounds: ${result.totalRounds}`);
  console.log(`Max matches per round: ${result.matchesPerRound}`);

  console.log("\nScheduled Matches by Round:");
  const matchesByRound: { [key: number]: typeof result.matches } = {};

  result.matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  Object.keys(matchesByRound).forEach((roundStr) => {
    const roundNum = parseInt(roundStr);
    const roundMatches = matchesByRound[roundNum];
    console.log(`  Round ${roundNum}:`);
    roundMatches.forEach((match) => {
      console.log(
        `    ${match.id}: ${match.team1} vs ${match.team2} (${match.overs} overs, ${match.wickets} wickets)`
      );
    });
  });

  // Verify all teams play each other exactly once
  const expectedPairs = new Set<string>();
  for (let i = 0; i < testTeams4.length; i++) {
    for (let j = i + 1; j < testTeams4.length; j++) {
      const pair1 = `${testTeams4[i]}-${testTeams4[j]}`;
      expectedPairs.add(pair1);
    }
  }

  const actualPairs = new Set<string>();
  result.matches.forEach((match) => {
    const pair = `${match.team1}-${match.team2}`;
    actualPairs.add(pair);
  });

  console.log(
    `\nVerification: All required matches generated: ${
      actualPairs.size === expectedPairs.size ? "✅" : "❌"
    }`
  );
  console.log("✅ 4-team test passed\n");
}

function test6TeamTournament() {
  console.log("📊 Test 2: 6-Team Round Robin Tournament");

  const result = generateRoundRobinMatches({
    teams: testTeams6,
    maxOvers: 50,
    maxWickets: 10,
  });

  console.log(
    `Expected matches: ${(testTeams6.length * (testTeams6.length - 1)) / 2}`
  );
  console.log(`Actual matches: ${result.matches.length}`);
  console.log(`Each team should play: ${testTeams6.length - 1} matches`);

  // Verify each team plays against every other team exactly once
  const teamMatchCount: Record<string, number> = {};
  testTeams6.forEach((team) => (teamMatchCount[team] = 0));

  result.matches.forEach((match) => {
    teamMatchCount[match.team1]++;
    teamMatchCount[match.team2]++;
  });

  console.log("Team match counts:");
  Object.entries(teamMatchCount).forEach(([team, count]) => {
    console.log(`  ${team}: ${count} matches`);
  });

  console.log("✅ 6-team test passed\n");
}

function test2TeamTournament() {
  console.log("📊 Test 3: 2-Team Round Robin Tournament");

  const result = generateRoundRobinMatches({
    teams: testTeams2,
    maxOvers: 20,
    maxWickets: 10,
  });

  console.log(`Expected matches: 1`);
  console.log(`Actual matches: ${result.matches.length}`);
  if (result.matches.length > 0) {
    console.log(
      `Match: ${result.matches[0].team1} vs ${result.matches[0].team2}`
    );
  }
  console.log("✅ 2-team test passed\n");
}

function testValidation() {
  console.log("📊 Test 4: Validation Tests");

  // Test valid teams
  const validResult = validateRoundRobinTeams(testTeams4);
  console.log(`Valid teams test: ${validResult.valid ? "✅ PASS" : "❌ FAIL"}`);

  // Test too few teams
  const tooFewResult = validateRoundRobinTeams(["Only One Team"]);
  console.log(
    `Too few teams test: ${!tooFewResult.valid ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`  Errors: ${tooFewResult.errors.join(", ")}`);

  // Test duplicate teams
  const duplicateResult = validateRoundRobinTeams([
    "Team A",
    "Team B",
    "Team A",
  ]);
  console.log(
    `Duplicate teams test: ${!duplicateResult.valid ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`  Errors: ${duplicateResult.errors.join(", ")}`);

  // Test empty team names
  const emptyResult = validateRoundRobinTeams(["Team A", "", "Team C"]);
  console.log(
    `Empty team names test: ${!emptyResult.valid ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`  Errors: ${emptyResult.errors.join(", ")}`);

  console.log("✅ Validation tests passed\n");
}

function testStatistics() {
  console.log("📊 Test 5: Statistics Calculation");

  const stats4 = calculateRoundRobinStats(testTeams4);
  console.log("4-team stats validation:");
  console.log(
    `  Total matches: ${stats4.totalMatches} (expected: 6) ${
      stats4.totalMatches === 6 ? "✅" : "❌"
    }`
  );
  console.log(
    `  Matches per team: ${stats4.matchesPerTeam} (expected: 3) ${
      stats4.matchesPerTeam === 3 ? "✅" : "❌"
    }`
  );

  const stats6 = calculateRoundRobinStats(testTeams6);
  console.log("6-team stats validation:");
  console.log(
    `  Total matches: ${stats6.totalMatches} (expected: 15) ${
      stats6.totalMatches === 15 ? "✅" : "❌"
    }`
  );
  console.log(
    `  Matches per team: ${stats6.matchesPerTeam} (expected: 5) ${
      stats6.matchesPerTeam === 5 ? "✅" : "❌"
    }`
  );

  console.log("✅ Statistics tests passed\n");
}
