import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Read the current Better Auth session in Server Components / Server Actions.
 * Returns `null` when there is no valid session.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Require an authenticated user. Redirects to /login when there is no session.
 * Returns the authenticated user.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}
