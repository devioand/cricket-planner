"use client";

import {
  Box,
  Heading,
  HStack,
  Input,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuSwords } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { TeamListEditor } from "@/components/tournaments/wizard/team-list-editor";
import { BeltStore } from "@/lib/hold-the-belt/belt-store";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;

export function BeltSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [target, setTarget] = useState(3);
  const [cap, setCap] = useState(12);
  const [starting, setStarting] = useState(false);

  const count = players.length;
  const valid =
    name.trim().length > 0 &&
    count >= MIN_PLAYERS &&
    count <= MAX_PLAYERS &&
    target >= 2 &&
    cap >= target;

  const start = () => {
    if (!valid || starting) return;
    setStarting(true);
    const session = BeltStore.create({
      name: name.trim(),
      players,
      targetStreak: target,
      gameCap: cap,
    });
    router.push(`/belt/${session.id}`);
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="600px" mx="auto" w="full" pb="112px">
      <VStack align="stretch" gap={6}>
        <VStack align="stretch" gap={1}>
          <HStack gap={2} color="fg.default">
            <Box color="brand.solid" fontSize="xl" lineHeight="1">
              <LuSwords />
            </Box>
            <Heading size={{ base: "lg", md: "xl" }}>Hold the Belt</Heading>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Winner stays on. Stack up a streak, hold the belt — settle who&apos;s
            the boss.
          </Text>
        </VStack>

        {/* Name */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            Session name
          </Text>
          <Input
            placeholder="e.g. Friday Night Belt"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            size="lg"
            autoFocus
            bg="input.bg"
            borderColor="input.border"
            color="fg.default"
            _placeholder={{ color: "fg.placeholder" }}
          />
        </Box>

        {/* Players */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
            Players / teams ({count})
          </Text>
          <TeamListEditor teams={players} onChange={setPlayers} />
          <Text fontSize="xs" color="fg.muted" mt={2}>
            {MIN_PLAYERS}–{MAX_PLAYERS} players. Best with 3–5 on one pitch.
          </Text>
        </Box>

        {/* Rules */}
        <HStack gap={4} align="stretch">
          <NumberField
            label="Win streak"
            helper="wins in a row to take the belt"
            value={target}
            min={2}
            max={6}
            onChange={setTarget}
          />
          <NumberField
            label="Game cap"
            helper="longest reign wins if reached"
            value={cap}
            min={target}
            max={40}
            onChange={setCap}
          />
        </HStack>
      </VStack>

      {/* Sticky start */}
      <Box
        position="fixed"
        bottom={{ base: "72px", md: 0 }}
        left={0}
        right={0}
        bg="bg.panel"
        borderTopWidth={1}
        borderColor="border.default"
        px={4}
        py={3}
        zIndex={10}
      >
        <Box maxW="600px" mx="auto">
          <Button
            onClick={start}
            disabled={!valid}
            loading={starting}
            colorPalette="brand"
            w="full"
            size="lg"
          >
            🥊 Start the belt
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function NumberField({
  label,
  helper,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <Box flex="1">
      <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.default">
        {label}
      </Text>
      <NumberInput.Root
        value={value.toString()}
        min={min}
        max={max}
        onValueChange={(d) => {
          const v = parseInt(d.value);
          if (!isNaN(v)) onChange(v);
        }}
        size="lg"
      >
        <NumberInput.Control />
        <NumberInput.Input
          bg="input.bg"
          borderColor="input.border"
          color="fg.default"
        />
      </NumberInput.Root>
      <Text fontSize="xs" color="fg.muted" mt={1}>
        {helper}
      </Text>
    </Box>
  );
}
