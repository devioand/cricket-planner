import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { LuListOrdered, LuMedal, LuSwords, LuTrophy } from "react-icons/lu";
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
export const NAV_ITEMS: NavItem[] = [
  { label: "Tournaments", href: "/tournaments", icon: LuSwords },
  { label: "Trophies", href: "/trophies", icon: LuTrophy },
  { label: "Awards", href: "/awards", icon: LuMedal },
  { label: "Leaderboard", href: "/leaderboard", icon: LuListOrdered },
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
