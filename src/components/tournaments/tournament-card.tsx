"use client";

import type {
  TournamentStatus,
  TournamentSummary,
} from "@/lib/repositories/tournament-repository";
import {
  Badge,
  Card,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { LuTrash2 } from "react-icons/lu";

const ALGORITHM_LABELS: Record<string, string> = {
  "round-robin": "Round Robin",
  "single-elimination": "Single Elimination",
  "double-elimination": "Double Elimination",
  "triple-elimination": "Triple Elimination",
};

const STATUS_META: Record<TournamentStatus, { label: string; color: string }> =
  {
    setup: { label: "Setup", color: "gray" },
    in_progress: { label: "In Progress", color: "blue" },
    completed: { label: "Completed", color: "green" },
  };

function subPathForStatus(status: TournamentStatus): string {
  return status === "setup" ? "setup" : "matches";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TournamentCard({
  tournament: t,
  onDelete,
}: {
  tournament: TournamentSummary;
  onDelete?: (t: TournamentSummary) => void;
}) {
  const router = useRouter();
  const status = STATUS_META[t.status];
  const href = `/tournament/round-robin/${t.id}/${subPathForStatus(t.status)}`;

  return (
    <Card.Root
      borderWidth={1}
      borderColor="card.border"
      bg="card.bg"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: "blue.300", shadow: "sm" }}
      onClick={() => router.push(href)}
    >
      <Card.Body p={{ base: 4, md: 5 }}>
        <HStack justify="space-between" align="start" gap={4}>
          <VStack align="start" gap={2} flex="1" minW={0}>
            <HStack gap={2} flexWrap="wrap">
              <Text
                fontWeight="semibold"
                fontSize={{ base: "md", md: "lg" }}
                color="fg.default"
              >
                {t.name}
              </Text>
              <Badge
                colorPalette={status.color}
                variant="subtle"
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                {status.label}
              </Badge>
            </HStack>

            <HStack
              gap={{ base: 2, md: 3 }}
              flexWrap="wrap"
              color="fg.muted"
              fontSize="sm"
            >
              <Text>{ALGORITHM_LABELS[t.algorithm] ?? t.algorithm}</Text>
              <Text>•</Text>
              <Text>
                {t.teamCount} {t.teamCount === 1 ? "team" : "teams"}
              </Text>
              <Text>•</Text>
              <Text>{t.maxOvers} overs</Text>
            </HStack>

            {t.status === "completed" && t.winner ? (
              <Text fontSize="sm" fontWeight="medium" color="green.600">
                🏆 Champion: {t.winner}
              </Text>
            ) : null}

            <Text fontSize="xs" color="fg.subtle">
              Updated {formatDate(t.updatedAt)}
            </Text>
          </VStack>

          {onDelete && (
            <IconButton
              aria-label="Delete tournament"
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(t);
              }}
            >
              <LuTrash2 />
            </IconButton>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
