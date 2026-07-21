import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { LuHistory, LuHouse, LuTrophy, LuUsers } from "react-icons/lu";
import { useSession } from "@/lib/auth-client";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

/**
 * The primary navigation. Shared by the desktop top nav (header) and the
 * mobile bottom tab bar so the two never drift apart.
 */
// Four tabs: Home is the launchpad, History is everything played, Cabinet holds
// trophies + awards, Club holds players/rivalries (old Leaderboard folds in).
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: LuHouse },
  { label: "History", href: "/tournaments", icon: LuHistory },
  { label: "Cabinet", href: "/trophies", icon: LuTrophy },
  { label: "Club", href: "/club", icon: LuUsers },
];

/** A tab is active on its own route and any nested route beneath it. */
export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Whether the primary nav should show. Hidden while a tournament is being
 * run (that screen has its own app bar) and on the auth pages, and only for
 * a signed-in user.
 */
export function useNavVisible() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  if (pathname.startsWith("/tournament/round-robin/")) return false;
  if (pathname === "/login" || pathname === "/signup") return false;
  return !isPending && !!session;
}
