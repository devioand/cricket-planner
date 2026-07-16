"use client";

import {
  Badge,
  Box,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LuRotateCcw, LuSwords } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TrophyBadge } from "@/components/trophies/trophy-badge";
import { BeltStore } from "@/lib/hold-the-belt/belt-store";
import { deriveView } from "@/lib/hold-the-belt/engine";
import type { BeltSession } from "@/lib/hold-the-belt/types";

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
  const view = deriveView(session);

  if (view.champion) {
    return <BeltChampion session={session} store={store} />;
  }

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
                colorPalette="blue"
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
                  colorPalette={i === 0 ? "blue" : "gray"}
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
        <Badge colorPalette="blue" variant="subtle" size="sm">
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
  session,
  store,
}: {
  session: BeltSession;
  store: BeltStore;
}) {
  const router = useRouter();
  const view = deriveView(session);

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
          <Heading size={{ base: "xl", md: "2xl" }}>
            🏆 {view.champion}
          </Heading>
          <Text fontSize="md" color="fg.muted">
            is the boss
          </Text>
        </VStack>

        <Badge colorPalette="yellow" variant="subtle" size="lg">
          {view.champReason === "streak"
            ? `${session.targetStreak} straight wins`
            : `Longest reign · ${view.longestReign?.streak ?? 0} in a row`}
        </Badge>

        <VStack align="stretch" gap={2.5} w="full" maxW="320px" pt={2}>
          <Button
            onClick={() => {
              store.reset();
            }}
            colorPalette="blue"
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
        </VStack>
      </VStack>
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
        <Button onClick={() => router.push("/belt/new")} colorPalette="blue">
          Start a new belt
        </Button>
      </VStack>
    </Box>
  );
}
