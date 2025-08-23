// Tournament types and interfaces for the tournament module

export type TournamentType =
  | "round-robin"
  | "single-elimination"
  | "double-elimination"
  | "triple-elimination";

// Match interface used by tournament state
export interface Match {
  id: string;
  team1: string;
  team2: string;
  round: number;
  status: "scheduled" | "in-progress" | "completed";
  venue?: string;
  overs: number;
  wickets: number;
}

// Tournament state interface
export interface TournamentState {
  algorithm: TournamentType;
  teams: string[];
  maxOvers: number;
  maxWickets: number;
  matches: Match[];
  isGenerated: boolean;
}

// Extended types for future features
export interface Team {
  id: string;
  name: string;
  players?: string[];
  logo?: string;
  stats?: TeamStats;
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
  result?: MatchResult;
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
