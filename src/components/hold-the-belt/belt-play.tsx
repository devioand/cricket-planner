"use client";

import {
  Badge,
  Box,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LuRotateCcw, LuSwords } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import { BeltStore } from "@/lib/hold-the-belt/belt-store";
import {
  deriveView,
  guaranteedChampion,
  projectChampion,
} from "@/lib/hold-the-belt/engine";
import type { BeltSession, BeltStanding } from "@/lib/hold-the-belt/types";

export function BeltPlay({ id }: { id: string }) {
  const [store, setStore] = useState<BeltStore | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const session = BeltStore.load(id);
    if (session) setStore(new BeltStore(session));
    else setNotFound(true);
  }, [id]);

  if (notFound) return <BeltMissing />;
  if (!store) return null; // brief; localStorage read is synchronous on mount
  return <BeltPlayInner store={store} />;
}

function BeltPlayInner({ store }: { store: BeltStore }) {
  const session = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const [playingOut, setPlayingOut] = useState(false);
  const view = deriveView(session);

  // Literal finish (streak reached / cap played out).
  if (view.champion) {
    return (
      <BeltChampion
        champion={view.champion}
        reason={view.champReason ?? "cap"}
        session={session}
        store={store}
      />
    );
  }

  // Early clinch: the remaining games can't change the winner — skip the dead
  // rubber and crown now (unless the crew chooses to play it out).
  const clinched = guaranteedChampion(session);
  if (clinched && !playingOut) {
    return (
      <BeltChampion
        champion={clinched}
        reason="clinched"
        session={session}
        store={store}
        gamesSkipped={view.gamesLeft}
        onPlayOut={() => setPlayingOut(true)}
      />
    );
  }

  // Exact projection for a decisive game (holder's match point or the cap game).
  const ifHolderWins = view.holder
    ? projectChampion(session, view.holder)
    : null;
  const ifChallengerWins = view.challenger
    ? projectChampion(session, view.challenger)
    : null;
  const decisive = Boolean(ifHolderWins || ifChallengerWins);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <VStack align="stretch" gap={1}>
          <Heading size={{ base: "lg", md: "xl" }}>{session.name}</Heading>
          <Text fontSize="sm" color="fg.muted">
            First to {session.targetStreak} in a row takes the belt ·{" "}
            {view.gamesLeft} game{view.gamesLeft === 1 ? "" : "s"} left before
            the cap
          </Text>
        </VStack>

        {/* Arena */}
        {view.holder && view.challenger ? (
          <VStack align="stretch" gap={4}>
            <HolderCard
              name={view.holder}
              streak={view.streak}
              target={session.targetStreak}
            />

            <HStack justify="center" gap={3} color="fg.muted">
              <Box flex="1" h="1px" bg="border.default" />
              <Text fontSize="xs" fontWeight="bold" letterSpacing="0.1em">
                VS
              </Text>
              <Box flex="1" h="1px" bg="border.default" />
            </HStack>

            <ChallengerCard name={view.challenger} />

            {decisive && (
              <OnTheLine
                lastGame={view.gamesLeft === 1}
                holder={view.holder}
                challenger={view.challenger}
                ifHolderWins={ifHolderWins}
                ifChallengerWins={ifChallengerWins}
              />
            )}

            {/* Who won */}
            <VStack align="stretch" gap={2.5} pt={1}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.05em"
                color="fg.muted"
                textAlign="center"
              >
                Who won?
              </Text>
              <Button
                onClick={() => store.recordWinner(view.holder!)}
                colorPalette="yellow"
                size="lg"
                w="full"
              >
                🏆 {view.holder} defends
              </Button>
              <Button
                onClick={() => store.recordWinner(view.challenger!)}
                colorPalette="brand"
                variant="outline"
                size="lg"
                w="full"
              >
                ⚔️ {view.challenger} takes it
              </Button>
            </VStack>
          </VStack>
        ) : (
          <Text color="fg.muted">Not enough players to start.</Text>
        )}

        {/* On deck / queue */}
        {view.queue.length > 0 && (
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.05em"
              color="fg.muted"
              mb={2}
            >
              Up next
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {view.queue.map((p, i) => (
                <Badge
                  key={p}
                  colorPalette={i === 0 ? "brand" : "gray"}
                  variant={i === 0 ? "solid" : "subtle"}
                  size="lg"
                >
                  {i === 0 ? "On deck: " : ""}
                  {p}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* Live standings */}
        {view.gamesPlayed > 0 && <Standings standings={view.standings} />}

        {/* Footer: progress + undo */}
        <HStack justify="space-between" pt={2}>
          <Text fontSize="sm" color="fg.muted">
            Game {view.gamesPlayed + 1} of up to {session.gameCap}
          </Text>
          {view.gamesPlayed > 0 && (
            <Button
              onClick={() => store.undo()}
              variant="ghost"
              size="sm"
              colorPalette="gray"
            >
              <LuRotateCcw /> Undo
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

function HolderCard({
  name,
  streak,
  target,
}: {
  name: string;
  streak: number;
  target: number;
}) {
  const toWin = Math.max(0, target - streak);
  return (
    <Box
      p={5}
      borderRadius="xl"
      borderWidth="2px"
      borderColor={{ base: "yellow.400", _dark: "yellow.600" }}
      bg={{ base: "yellow.50", _dark: "yellow.950" }}
    >
      <VStack gap={3}>
        <Badge colorPalette="yellow" variant="solid" size="sm">
          🏆 Holds the belt
        </Badge>
        <Heading size="xl" textAlign="center" lineHeight="1.1">
          {name}
        </Heading>
        <StreakDots streak={streak} target={target} />
        <Text fontSize="sm" color="fg.muted">
          {streak === 0
            ? "Fresh belt — win to start a reign"
            : toWin === 0
              ? "Champion!"
              : `${streak} in a row · ${toWin} more to win it`}
        </Text>
      </VStack>
    </Box>
  );
}

function ChallengerCard({ name }: { name: string }) {
  return (
    <Box
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="card.bg"
    >
      <VStack gap={1}>
        <Badge colorPalette="brand" variant="subtle" size="sm">
          <LuSwords /> Challenger
        </Badge>
        <Heading size="lg" textAlign="center" lineHeight="1.1">
          {name}
        </Heading>
      </VStack>
    </Box>
  );
}

function StreakDots({ streak, target }: { streak: number; target: number }) {
  return (
    <HStack gap={1.5}>
      {Array.from({ length: target }).map((_, i) => (
        <Box
          key={i}
          w="10px"
          h="10px"
          borderRadius="full"
          bg={
            i < streak
              ? { base: "yellow.500", _dark: "yellow.400" }
              : "bg.emphasized"
          }
          transition="background 0.2s"
        />
      ))}
    </HStack>
  );
}

function BeltChampion({
  champion,
  reason,
  session,
  store,
  gamesSkipped,
  onPlayOut,
}: {
  champion: string;
  reason: "streak" | "cap" | "clinched";
  session: BeltSession;
  store: BeltStore;
  gamesSkipped?: number;
  onPlayOut?: () => void;
}) {
  const router = useRouter();
  const view = deriveView(session);
  const championReign =
    view.standings.find((s) => s.player === champion)?.longestReign ?? 0;

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti")
      .then((m) => {
        if (cancelled) return;
        m.default({ particleCount: 140, spread: 75, origin: { y: 0.35 } });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const reasonText =
    reason === "streak"
      ? `${session.targetStreak} straight wins`
      : reason === "clinched"
        ? "Clinched — unbeatable on reign + wins"
        : `Longest reign · ${championReign} in a row`;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack gap={5} py={{ base: 8, md: 12 }} textAlign="center">
        <Text
          fontSize="sm"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.1em"
          color="fg.muted"
        >
          {session.name}
        </Text>

        <TrophyBadge
          config={{ shape: "belt", metal: "gold" }}
          size="lg"
          showWonBy={false}
        />

        <VStack gap={1}>
          <Heading size={{ base: "xl", md: "2xl" }}>🏆 {champion}</Heading>
          <Text fontSize="md" color="fg.muted">
            is the boss
          </Text>
        </VStack>

        <Badge colorPalette="yellow" variant="subtle" size="lg">
          {reasonText}
        </Badge>

        {reason === "clinched" && gamesSkipped ? (
          <Text fontSize="sm" color="fg.muted" maxW="340px">
            Decided with {gamesSkipped} game{gamesSkipped === 1 ? "" : "s"} to
            spare — no remaining match could change the result.
          </Text>
        ) : null}

        <VStack align="stretch" gap={2.5} w="full" maxW="320px" pt={2}>
          <Button
            onClick={() => {
              store.reset();
            }}
            colorPalette="brand"
            size="lg"
            w="full"
          >
            🔁 Rematch (same crew)
          </Button>
          <Button
            onClick={() => router.push("/belt/new")}
            variant="outline"
            colorPalette="gray"
            size="lg"
            w="full"
          >
            🥊 New belt
          </Button>
          {onPlayOut && (
            <Button
              onClick={onPlayOut}
              variant="ghost"
              colorPalette="gray"
              size="sm"
              w="full"
            >
              Play out the remaining games anyway
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}

function OnTheLine({
  lastGame,
  holder,
  challenger,
  ifHolderWins,
  ifChallengerWins,
}: {
  lastGame: boolean;
  holder: string;
  challenger: string;
  ifHolderWins: string | null;
  ifChallengerWins: string | null;
}) {
  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={{ base: "orange.300", _dark: "orange.700" }}
      bg={{ base: "orange.50", _dark: "orange.950" }}
    >
      <VStack align="stretch" gap={2}>
        <Text fontWeight="bold" fontSize="sm" textAlign="center">
          {lastGame
            ? "🏁 Last game — the belt is on the line"
            : "🎯 Match point"}
        </Text>
        <VStack align="stretch" gap={1}>
          <Text fontSize="sm">
            🏆 <Strong>{holder}</Strong> wins →{" "}
            {ifHolderWins ? (
              <>
                <Strong>{ifHolderWins}</Strong> takes the belt
              </>
            ) : (
              "the belt stays in play"
            )}
          </Text>
          <Text fontSize="sm">
            ⚔️ <Strong>{challenger}</Strong> wins →{" "}
            {ifChallengerWins ? (
              <>
                <Strong>{ifChallengerWins}</Strong> takes the belt
              </>
            ) : (
              "the chase continues"
            )}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}

function Standings({ standings }: { standings: BeltStanding[] }) {
  return (
    <Box>
      <VStack align="stretch" gap={0.5} mb={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.05em"
          color="fg.muted"
        >
          Standings
        </Text>
        <Text fontSize="xs" color="fg.muted">
          🔥 longest streak wins at the cap (ties → most wins) · W = games won
        </Text>
      </VStack>
      <VStack align="stretch" gap={1.5}>
        {standings.map((s, i) => (
          <HStack
            key={s.player}
            justify="space-between"
            px={3}
            py={2}
            borderRadius="md"
            borderWidth="1px"
            borderColor={
              s.isLeader
                ? { base: "yellow.300", _dark: "yellow.700" }
                : "border.default"
            }
            bg={
              s.isLeader ? { base: "yellow.50", _dark: "yellow.950" } : "bg.subtle"
            }
          >
            <HStack gap={2} minW={0}>
              <Text fontSize="sm" fontWeight="bold" color="fg.muted" w="16px">
                {i + 1}
              </Text>
              <Text fontSize="sm" fontWeight="medium" truncate>
                {s.player}
              </Text>
              {s.isHolder && (
                <Badge colorPalette="yellow" variant="solid" size="sm">
                  🏆
                </Badge>
              )}
              {s.isLeader && (
                <Badge colorPalette="yellow" variant="subtle" size="sm">
                  Leading
                </Badge>
              )}
            </HStack>
            <HStack gap={3} flexShrink={0}>
              <Text fontSize="sm">🔥 {s.longestReign}</Text>
              <Text fontSize="sm" color="fg.muted">
                {s.totalWins}W
              </Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return (
    <Box as="span" fontWeight="semibold" color="fg.default">
      {children}
    </Box>
  );
}

function BeltMissing() {
  const router = useRouter();
  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full">
      <VStack gap={4} py={{ base: 16, md: 24 }} textAlign="center">
        <Box fontSize="5xl" color="fg.muted" opacity={0.6}>
          <LuSwords />
        </Box>
        <Heading size="md">Belt session not found</Heading>
        <Text fontSize="sm" color="fg.muted" maxW="320px">
          It may have been played on another device — sessions are stored on the
          device that created them.
        </Text>
        <Button onClick={() => router.push("/belt/new")} colorPalette="brand">
          Start a new belt
        </Button>
      </VStack>
    </Box>
  );
}
