"use client";

import {
  Box,
  ClientOnly,
  HStack,
  IconButton,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LuArrowLeft,
  LuInfo,
  LuCloudOff,
  LuCheck,
  LuMoon,
  LuSun,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useColorMode } from "@/components/ui/color-mode";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { useSyncTournament } from "@/lib/query/use-tournament-sync";
import { TournamentDetailsDialog } from "@/components/tournaments/tournament-details-dialog";

/**
 * The tournament's top app bar — it replaces the generic site nav on tournament
 * pages. Full-width and sticky, holding only the essentials: exit, name (tap for
 * details), how far along you are, sync, and the theme toggle. Below it, the
 * Matches / Standings switch.
 */
export function TournamentHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const { state, isDirty, lastSyncedAt, readOnly, hydrating, store } =
    useLiveTournament();
  const sync = useSyncTournament();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const base = `/tournament/round-robin/${store.id}`;
  const tabs = [
    { href: `${base}/matches`, label: "Matches" },
    { href: `${base}/standings`, label: "Standings" },
    { href: `${base}/stats`, label: "Stats" },
  ];

  const total = state.matches.length;
  const completed = state.matches.filter((m) => m.status === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const done = pct === 100;

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={30}
      bg="bg.canvas"
      borderBottomWidth={1}
      borderColor="border.default"
      w="full"
    >
      <Box maxW="600px" mx="auto" px={{ base: 3, md: 5 }} py={2.5}>
        <VStack align="stretch" gap={3}>
          {/* Row 1: exit · name (+ progress, tap for details) · sync · theme */}
          <HStack gap={1} align="center">
            <Link href="/tournaments">
              <IconButton
                aria-label="Back to tournaments"
                variant="outline"
                colorPalette="gray"
                size="sm"
                flexShrink={0}
              >
                <LuArrowLeft />
              </IconButton>
            </Link>

            <Box
              as="button"
              onClick={() => setDetailsOpen(true)}
              textAlign="left"
              minW={0}
              flex={1}
              ml={2}
            >
              <HStack gap={1.5} align="center" minW={0}>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: "md", md: "lg" }}
                  color="fg.default"
                  truncate
                >
                  {name}
                </Text>
                <Box color="fg.subtle" flexShrink={0} display="flex">
                  <LuInfo size={14} />
                </Box>
              </HStack>
              <Text
                fontSize="xs"
                color={done ? "green.500" : "fg.muted"}
                fontWeight={done ? "semibold" : "normal"}
              >
                {completed} of {total} completed · {pct}%
              </Text>
            </Box>

            {!hydrating && (
              <SyncState
                readOnly={readOnly}
                isDirty={isDirty}
                lastSyncedAt={lastSyncedAt}
                syncing={sync.isPending}
                busy={sync.isPending}
                onSync={() => sync.mutate()}
              />
            )}
            <ThemeToggle />
          </HStack>

          {/* Row 2: Matches / Standings filled segmented control */}
          <HStack
            gap={1}
            bg="bg.subtle"
            borderRadius="lg"
            p={1}
            borderWidth={1}
            borderColor="border.subtle"
          >
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{ flex: 1, display: "flex" }}
                >
                  <Box
                    w="full"
                    textAlign="center"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={active ? "semibold" : "medium"}
                    colorPalette="blue"
                    bg={active ? "colorPalette.500" : "transparent"}
                    color={active ? "white" : "fg.muted"}
                    transition="all 0.15s"
                    _hover={active ? {} : { color: "fg.default" }}
                  >
                    {tab.label}
                  </Box>
                </Link>
              );
            })}
          </HStack>
        </VStack>
      </Box>

      <TournamentDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        name={name}
      />
    </Box>
  );
}

/** Icon-only light/dark toggle (outline, matching the back button). */
function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const goingDark = colorMode !== "dark";
  return (
    <ClientOnly fallback={<Skeleton boxSize="32px" borderRadius="md" flexShrink={0} />}>
      <IconButton
        variant="outline"
        colorPalette="gray"
        size="sm"
        onClick={toggleColorMode}
        flexShrink={0}
        aria-label={goingDark ? "Switch to dark mode" : "Switch to light mode"}
      >
        {goingDark ? <LuMoon size={16} /> : <LuSun size={16} />}
      </IconButton>
    </ClientOnly>
  );
}

function SyncState({
  readOnly,
  isDirty,
  lastSyncedAt,
  syncing,
  busy,
  onSync,
}: {
  readOnly: boolean;
  isDirty: boolean;
  lastSyncedAt: string | null;
  syncing: boolean;
  busy: boolean;
  onSync: () => void;
}) {
  // A finished tournament is already persisted and read-only.
  if (readOnly) {
    return (
      <HStack gap={1.5} flexShrink={0} color="green.500" px={1}>
        <LuCheck size={14} />
        <Text
          fontSize="xs"
          fontWeight="medium"
          display={{ base: "none", sm: "block" }}
        >
          Saved
        </Text>
      </HStack>
    );
  }

  if (isDirty) {
    return (
      <Button
        size="xs"
        colorPalette="blue"
        onClick={onSync}
        loading={syncing}
        disabled={busy}
        flexShrink={0}
      >
        <HStack gap={1.5}>
          <LuCloudOff size={14} />
          <Text>Sync</Text>
        </HStack>
      </Button>
    );
  }

  const savedLabel = lastSyncedAt
    ? `Saved ${new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Saved";
  return (
    <HStack gap={1.5} flexShrink={0} color="fg.muted" px={1}>
      <Box color="green.500" display="flex">
        <LuCheck size={14} />
      </Box>
      <Text
        fontSize="xs"
        fontWeight="medium"
        display={{ base: "none", sm: "block" }}
      >
        {savedLabel}
      </Text>
    </HStack>
  );
}
