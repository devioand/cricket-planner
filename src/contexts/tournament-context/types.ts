// Tournament types and interfaces for the tournament module

export type TournamentType =
  | "round-robin"
  | "single-elimination"
  | "double-elimination"
  | "triple-elimination";

export type TournamentPhase =
  | "setup"
  | "round-robin"
  | "playoffs"
  | "completed";

export type PlayoffFormat =
  | "none" // Champion = round-robin table topper, no playoff matches
  | "final-only" // Top 2 play a single final
  | "world-cup" // Simple knockout: SF1, SF2, Final
  | "league" // IPL style: Q1, Eliminator, Q2, Final
  | "custom"; // User-authored PlayoffConfig

/**
 * @deprecated Legacy union of preset playoff round labels. `Match.playoffType`
 * is now a free string label; new code should rely on `Match.isFinal` and
 * `Match.label` instead. Kept for reference/back-compat during migration.
 */
export type PlayoffType =
  | "semi-final-1"
  | "semi-final-2"
  | "final"
  // League format specific
  | "qualifier-1"
  | "eliminator"
  | "qualifier-2";

/**
 * A single slot (one side) of a playoff match. It resolves to a concrete team
 * either from the round-robin standings (`seed`) or from the outcome of an
 * earlier playoff match in the same config (`winnerOf` / `loserOf`).
 */
export type PlayoffSlot =
  | { kind: "seed"; seed: number } // 1-based rank in final standings
  | { kind: "winnerOf"; matchId: string } // ref to a spec id in the same config
  | { kind: "loserOf"; matchId: string };

/** Declarative definition of one playoff match, resolved lazily as prerequisites complete. */
export interface PlayoffMatchSpec {
  id: string; // preset: legacy ids (SF-001…); custom: PO-001…
  label: string; // "Semi-Final 1", "Eliminator", "Final"…
  round: number; // play-order / display round
  slot1: PlayoffSlot;
  slot2: PlayoffSlot;
  isFinal?: boolean; // exactly one true → its winner is the champion
  playoffType?: string; // legacy alias so existing UI labels keep working
}

/** The full playoff structure for a tournament. */
export interface PlayoffConfig {
  qualifiers: number; // teams that reach playoffs (0 for "none")
  matches: PlayoffMatchSpec[];
}

// Toss decision types
export type TossDecision = "bat" | "bowl";

// Toss result interface
export interface TossResult {
  tossWinner: string; // Team that won the toss
  decision: TossDecision; // What they chose to do
  tossLoser: string; // Team that lost the toss
}

// Match interface used by tournament state
export interface Match {
  id: string;
  team1: string;
  team2: string;
  round: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  venue?: string;
  overs: number;
  maxWickets: number;
  toss?: TossResult; // Toss information
  result?: CricketMatchResult;
  // Innings control
  secondInningsStarted?: boolean; // Track when user starts second innings
  // Playoff specific fields
  isPlayoff?: boolean;
  playoffType?: string; // free label (legacy preset values or custom names)
  label?: string; // human-readable display label for this playoff match
  isFinal?: boolean; // canonical champion-decider flag (winner = champion)
  phase?: TournamentPhase;
}

// Cricket-specific match result with detailed scoring
export interface CricketMatchResult {
  winner: string;
  loser: string;
  isDraw?: boolean;
  isNoResult?: boolean; // For abandoned matches
  team1Innings: InningsScore | null;
  team2Innings: InningsScore | null;
  marginType?: "runs" | "wickets";
  margin?: number;
  matchType: "completed" | "abandoned" | "no-result";
}

// Detailed innings scoring information
export interface InningsScore {
  teamName: string;
  runs: number;
  wickets: number;
  overs: number; // Actual overs played (e.g., 47.2 overs = 47.33)
  ballsFaced: number; // Total balls faced for precise calculation
  isAllOut: boolean;
  runRate: number; // Calculated run rate
}

// Tournament state interface
/**
 * The trophy silhouette. Two families: classic tournament cups, and challenge
 * / fitness pieces (belt, crown, medal, flame, iron, bolt) for head-to-heads.
 */
export type TrophyShape =
  | "grand"
  | "classic"
  | "flute"
  | "chalice"
  | "star"
  | "orb"
  | "belt"
  | "crown"
  | "medal"
  | "flame"
  | "iron"
  | "bolt";

/** Preset metals, or "custom" to use `TrophyConfig.color`. */
export type TrophyMetal = "gold" | "silver" | "bronze" | "custom";

/**
 * A champion's trophy, designed in the setup wizard and awarded to whoever
 * wins the tournament. Composed from parts (shape + metal/color) so it renders
 * as a graphic — no image uploads, works offline. The tournament name and
 * winner are shown as captions in the cabinet, not engraved on the trophy.
 */
export interface TrophyConfig {
  shape: TrophyShape;
  metal: TrophyMetal;
  color?: string; // hex, used when metal === "custom"
}

export interface TournamentState {
  algorithm: TournamentType;
  teams: string[];
  maxOvers: number;
  maxWickets: number;
  matches: Match[];
  isGenerated: boolean;
  teamStats: Record<string, CricketTeamStats>; // Team name to stats mapping
  // Playoff specific state
  phase: TournamentPhase;
  playoffFormat: PlayoffFormat;
  // The resolved playoff structure used to generate playoff matches.
  // null before generation and for the "none" format.
  playoffConfig: PlayoffConfig | null;
  // The champion's trophy, designed in the wizard. Optional: absent on
  // tournaments created before trophies existed (they get a default in the UI).
  trophy?: TrophyConfig | null;
}

// Extended types for future features
export interface Team {
  id: string;
  name: string;
  players?: string[];
  logo?: string;
  stats?: TeamStats;
}

// Comprehensive cricket team statistics
export interface CricketTeamStats {
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  noResults: number;
  points: number;

  // Batting statistics
  totalRunsScored: number;
  totalBallsFaced: number;
  totalOversPlayed: number; // Actual overs played by team

  // Bowling/Fielding statistics
  totalRunsConceded: number;
  totalBallsBowled: number;
  totalOversBowled: number; // Actual overs bowled against team

  // Calculated rates
  battingRunRate: number; // Runs scored per over
  bowlingRunRate: number; // Runs conceded per over
  netRunRate: number; // NRR calculation

  // Additional stats
  highestScore?: number;
  lowestScore?: number;
  biggestWin?: {
    opponent: string;
    margin: number;
    marginType: "runs" | "wickets";
  };
}

export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  netRunRate?: number;
}

export interface ExtendedMatch extends Match {
  team1Extended?: Team;
  team2Extended?: Team;
  scheduledDate?: Date;
  nextMatchId?: string; // For elimination tournaments
  bracket?: "main" | "losers"; // For double/triple elimination
}

export interface MatchResult {
  winner: Team;
  loser: Team;
  score?: {
    team1Score: number;
    team2Score: number;
  };
  marginType?: "runs" | "wickets";
  margin?: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  teams: Team[];
  matches: ExtendedMatch[];
  status: "setup" | "in-progress" | "completed";
  createdAt: Date;
  settings: TournamentSettings;
}

export interface TournamentSettings {
  venue?: string;
  startDate?: Date;
  endDate?: Date;
  matchDuration?: number; // in hours
  timeBetweenMatches?: number; // in hours
  doubleHeadersAllowed?: boolean;
  maxMatchesPerDay?: number;
}

export interface TournamentBracket {
  rounds: Round[];
  type: TournamentType;
}

export interface Round {
  roundNumber: number;
  matches: ExtendedMatch[];
  name: string; // "Round 1", "Quarterfinals", "Semifinals", etc.
}

// Tournament format descriptions
export const TOURNAMENT_FORMATS = {
  "round-robin": {
    name: "Round Robin",
    description:
      "Every team plays every other team once. Points determine the winner.",
    minTeams: 3,
    maxTeams: 20,
    estimatedMatches: (teams: number) => (teams * (teams - 1)) / 2,
    pros: [
      "Fair format",
      "All teams get multiple games",
      "Best overall team wins",
    ],
    cons: ["Many matches required", "Takes longer to complete"],
  },
  "single-elimination": {
    name: "Single Elimination",
    description: "Teams are eliminated after one loss. Winner takes all.",
    minTeams: 4,
    maxTeams: 64,
    estimatedMatches: (teams: number) => teams - 1,
    pros: ["Quick tournament", "Exciting knockout format", "Fewer matches"],
    cons: ["Teams eliminated quickly", "Luck can play a big role"],
  },
  "double-elimination": {
    name: "Double Elimination",
    description:
      "Teams must lose twice to be eliminated. Winner and loser brackets.",
    minTeams: 4,
    maxTeams: 32,
    estimatedMatches: (teams: number) => teams * 2 - 2,
    pros: [
      "Second chance for teams",
      "More competitive",
      "Better than single elimination",
    ],
    cons: ["More complex bracket", "Longer than single elimination"],
  },
  "triple-elimination": {
    name: "Triple Elimination",
    description:
      "Teams must lose three times to be eliminated. Multiple brackets.",
    minTeams: 6,
    maxTeams: 24,
    estimatedMatches: (teams: number) => teams * 3 - 3,
    pros: [
      "Maximum fairness",
      "Everyone gets many chances",
      "Most competitive",
    ],
    cons: [
      "Very long tournament",
      "Complex to manage",
      "Many matches required",
    ],
  },
} as const;
