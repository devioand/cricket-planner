"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoundRobinTournament() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to setup page
    router.replace("/tournament/round-robin/setup");
  }, [router]);

  return null;
}
