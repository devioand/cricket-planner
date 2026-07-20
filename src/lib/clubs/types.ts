// A club is the recurring group you play with — the Saturday crew, not a
// registered institution. It owns a saved list of players so names are typed
// once rather than re-entered at every tournament.
//
// A player is deliberately NOT a user account. Most people who play will never
// open the app; they exist here as a name, and can optionally be linked to a
// real account later (see `userId`). Keeping the two separate is what lets the
// ground flow stay zero-friction.

/** Team names cap at 10 chars, and a player's name becomes a team name in a
 *  solo tournament — so the two limits have to agree. */
export const MAX_PLAYER_NAME_LENGTH = 10;

export interface ClubPlayer {
  id: string;
  name: string;
  createdAt: string;
  /** ISO date of the last tournament this player was picked for, or null.
   *  Drives "recently played first" ordering once the list grows. */
  lastPlayedAt: string | null;
  /** Set when a real account claims this player. Unused until claiming ships. */
  userId?: string | null;
}

export interface Club {
  id: string;
  name: string;
  players: ClubPlayer[];
  createdAt: string;
}
