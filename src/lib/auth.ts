import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";

/**
 * Better Auth server instance.
 *
 * Authentication is email + password only (no social providers, no email
 * verification for now). Sessions and users are stored in the same Supabase
 * Postgres database via the shared `pg` pool.
 *
 * `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are read from the environment.
 */
export const auth = betterAuth({
  database: pool,

  emailAndPassword: {
    enabled: true,
    // Sign the user in immediately after a successful sign-up.
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // No email provider wired up yet, so verification stays off.
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the session once per day
    cookieCache: {
      // Cache the session in a signed cookie to avoid a DB hit on every request.
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Must stay last: lets Better Auth set cookies from Next.js server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
