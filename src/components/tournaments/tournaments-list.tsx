"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  IconButton,
  Dialog,
  Portal,
  CloseButton,
  Input,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import {
  deleteTournamentAction,
  createTournamentAction,
} from "@/app/tournaments/actions";
import type {
  TournamentSummary,
  TournamentStatus,
} from "@/lib/repositories/tournament-repository";
import type { TournamentType } from "@/contexts/tournament-context/types";

const ALGORITHM_LABELS: Record<string, string> = {
  "round-robin": "Round Robin",
  "single-elimination": "Single Elimination",
  "double-elimination": "Double Elimination",
  "triple-elimination": "Triple Elimination",
};

const STATUS_META: Record<
  TournamentStatus,
  { label: string; color: string }
> = {
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

export function TournamentsList({
  tournaments,
  initialCreateFormat = null,
}: {
  tournaments: TournamentSummary[];
  initialCreateFormat?: TournamentType | null;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<TournamentSummary | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Create dialog (opens automatically when arriving with ?create=<format>).
  const [createFormat, setCreateFormat] = useState<TournamentType | null>(
    initialCreateFormat
  );
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const openCreate = () => {
    setCreateFormat("round-robin");
    setNewName("");
  };

  const closeCreate = () => {
    if (isCreating) return;
    setCreateFormat(null);
    setNewName("");
    // Drop the ?create= param so a refresh doesn't re-open the dialog.
    if (typeof window !== "undefined" && window.location.search) {
      router.replace("/tournaments");
    }
  };

  const handleCreate = async () => {
    if (!createFormat || !newName.trim()) return;
    setIsCreating(true);
    try {
      const { id } = await createTournamentAction({
        name: newName.trim(),
        algorithm: createFormat,
        playoffFormat: "world-cup",
        maxOvers: 20,
        maxWickets: 10,
      });
      router.push(`/tournament/round-robin/${id}/setup`);
    } catch (error) {
      console.error("Failed to create tournament:", error);
      setIsCreating(false);
      toaster.create({
        title: "Couldn't create tournament",
        description: "Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTournamentAction(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete tournament:", error);
      toaster.create({
        title: "Couldn't delete tournament",
        description: "Please try again.",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="900px" mx="auto" w="full">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Box>
            <Heading size={{ base: "lg", md: "xl" }}>My Tournaments</Heading>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Resume an ongoing tournament or revisit a completed one.
            </Text>
          </Box>
          <Button colorPalette="blue" onClick={openCreate}>
            <HStack gap={2}>
              <Text fontSize="lg">+</Text>
              <Text>New Tournament</Text>
            </HStack>
          </Button>
        </HStack>

        {/* Empty state */}
        {tournaments.length === 0 ? (
          <Box
            p={{ base: 8, md: 12 }}
            bg="bg.subtle"
            borderRadius="xl"
            textAlign="center"
          >
            <Text fontSize="4xl" mb={3}>
              🏏
            </Text>
            <Heading size="md" mb={2}>
              No tournaments yet
            </Heading>
            <Text color="fg.muted" mb={6}>
              Create your first tournament to get started.
            </Text>
            <Button colorPalette="blue" size="lg" onClick={openCreate}>
              🚀 Create a Tournament
            </Button>
          </Box>
        ) : (
          <VStack gap={3} align="stretch">
            {tournaments.map((t) => {
              const status = STATUS_META[t.status];
              const href = `/tournament/round-robin/${t.id}/${subPathForStatus(
                t.status
              )}`;
              return (
                <Card.Root
                  key={t.id}
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
                          <Text>
                            {ALGORITHM_LABELS[t.algorithm] ?? t.algorithm}
                          </Text>
                          <Text>•</Text>
                          <Text>
                            {t.teamCount} {t.teamCount === 1 ? "team" : "teams"}
                          </Text>
                          <Text>•</Text>
                          <Text>{t.maxOvers} overs</Text>
                        </HStack>

                        {t.status === "completed" && t.winner ? (
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="green.600"
                          >
                            🏆 Champion: {t.winner}
                          </Text>
                        ) : null}

                        <Text fontSize="xs" color="fg.subtle">
                          Updated {formatDate(t.updatedAt)}
                        </Text>
                      </VStack>

                      <IconButton
                        aria-label="Delete tournament"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(t);
                        }}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Card.Body>
                </Card.Root>
              );
            })}
          </VStack>
        )}
      </VStack>

      {/* Create tournament */}
      <Dialog.Root
        open={createFormat !== null}
        onOpenChange={(e) => !e.open && closeCreate()}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="420px"
              bg="dialog.bg"
              borderRadius="xl"
              p={4}
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <Dialog.Header px={2} pb={3}>
                <VStack gap={1} w="full" align="center">
                  <Text fontSize="lg" fontWeight="500">
                    Name Your Tournament
                  </Text>
                  {createFormat && (
                    <Text fontSize="sm" color="fg.muted">
                      {ALGORITHM_LABELS[createFormat] ?? createFormat}
                    </Text>
                  )}
                </VStack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    position="absolute"
                    top={4}
                    right={4}
                    size="sm"
                    color="fg.muted"
                    disabled={isCreating}
                    _hover={{ color: "fg.default", bg: "bg.subtle" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body p={2}>
                <VStack gap={4} w="full">
                  <Box w="full">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Tournament Name
                    </Text>
                    <Input
                      placeholder="e.g. Summer Cup 2026"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newName.trim() && !isCreating) {
                          handleCreate();
                        }
                      }}
                      maxLength={60}
                      size="lg"
                      autoFocus
                      bg="input.bg"
                      borderColor="input.border"
                      color="fg.default"
                      _placeholder={{ color: "fg.placeholder" }}
                      _focus={{
                        borderColor: "input.focusBorder",
                        boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                      }}
                    />
                  </Box>

                  <HStack gap={3} w="full">
                    <Button
                      variant="outline"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      colorPalette="gray"
                      fontWeight="500"
                      onClick={closeCreate}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="blue"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      fontSize="sm"
                      fontWeight="500"
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                      loading={isCreating}
                    >
                      Create
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete confirmation */}
      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(e) => !e.open && !isDeleting && setDeleteTarget(null)}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="420px"
              bg="dialog.bg"
              borderRadius="xl"
              p={4}
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            >
              <Dialog.Header pb={3}>
                <VStack gap={1} w="full" align="center">
                  <Text fontSize="lg" fontWeight="500" color="red.600">
                    Delete Tournament?
                  </Text>
                </VStack>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    position="absolute"
                    top={4}
                    right={4}
                    size="sm"
                    color="fg.muted"
                    disabled={isDeleting}
                    _hover={{ color: "fg.default", bg: "bg.subtle" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body px={2}>
                <VStack gap={4} w="full">
                  <Text textAlign="center" color="fg.default">
                    This will permanently delete{" "}
                    <Text as="span" fontWeight="semibold">
                      {deleteTarget?.name}
                    </Text>{" "}
                    and all of its matches and standings.
                  </Text>
                  <Text
                    fontSize="sm"
                    textAlign="center"
                    color="red.600"
                    fontWeight="medium"
                  >
                    This action cannot be undone.
                  </Text>

                  <HStack gap={3} w="full" pt={2}>
                    <Button
                      variant="outline"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      colorPalette="gray"
                      onClick={() => setDeleteTarget(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorPalette="red"
                      flex="1"
                      size="md"
                      h="44px"
                      borderRadius="lg"
                      onClick={handleDelete}
                      loading={isDeleting}
                    >
                      Delete
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
