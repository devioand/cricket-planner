"use client";

import { useState } from "react";
import {
  Box,
  Card,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Input,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPencil, LuTrash2, LuUsers } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { clubStore, ClubStore } from "@/lib/clubs/club-store";
import { useClub } from "@/lib/clubs/use-club";
import { MAX_PLAYER_NAME_LENGTH, type ClubPlayer } from "@/lib/clubs/types";

/**
 * The club screen — name the club and keep the player list. Players are just
 * names: nobody needs an account to be here, which is what keeps adding a
 * newcomer a five-second job at the ground.
 */
export function ClubManager() {
  const { club, hydrated } = useClub();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClubPlayer | null>(null);
  const [renamingClub, setRenamingClub] = useState(false);

  // Hold the paint until localStorage has been read.
  if (!hydrated) {
    return <Box minH="50vh" aria-busy="true" />;
  }

  if (!club) {
    return <CreateClub onCreate={(name) => clubStore.create(name)} />;
  }

  const players = ClubStore.byRecency(club.players);

  const addPlayer = () => {
    const name = draft.trim();
    if (!name) return;
    if (name.length > MAX_PLAYER_NAME_LENGTH) {
      setError(`Keep it to ${MAX_PLAYER_NAME_LENGTH} characters`);
      return;
    }
    if (!clubStore.addPlayer(name)) {
      setError(`${name} is already in the club`);
      return;
    }
    // Keep focus and clear, so a run of names can be typed without reaching
    // for the mouse — adding six people should be six Enters.
    setDraft("");
    setError(null);
  };

  return (
    <VStack align="stretch" gap={6}>
      <VStack align="stretch" gap={1}>
        <HStack justify="space-between" align="start" gap={3}>
          <Box minW={0}>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="1.15">
              {club.name}
            </Text>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              {players.length === 0
                ? "No players yet"
                : `${players.length} ${players.length === 1 ? "player" : "players"}`}
            </Text>
          </Box>
          <IconButton
            aria-label="Rename club"
            size="sm"
            variant="ghost"
            colorPalette="gray"
            onClick={() => setRenamingClub(true)}
          >
            <LuPencil />
          </IconButton>
        </HStack>
      </VStack>

      {/* Quick add — the fast path. */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Add a player
        </Text>
        <HStack gap={2}>
          <Input
            placeholder="Name"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPlayer();
            }}
            maxLength={MAX_PLAYER_NAME_LENGTH}
            size="lg"
            h="48px"
            bg="input.bg"
            borderColor="input.border"
            color="fg.default"
            _placeholder={{ color: "fg.placeholder" }}
            _focus={{
              borderColor: "input.focusBorder",
              boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
            }}
          />
          <Button
            colorPalette="brand"
            size="lg"
            h="48px"
            px={6}
            onClick={addPlayer}
            disabled={!draft.trim()}
          >
            Add
          </Button>
        </HStack>
        <Text fontSize="xs" color={error ? "red.500" : "fg.muted"} mt={1.5}>
          {error ?? "Press Enter to add another — no account needed."}
        </Text>
      </Box>

      {players.length === 0 ? (
        <EmptyPlayers />
      ) : (
        <VStack align="stretch" gap={2}>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              onEdit={() => setEditing(p)}
              onDelete={() => clubStore.removePlayer(p.id)}
            />
          ))}
        </VStack>
      )}

      <RenameDialog
        title="Rename club"
        label="Club name"
        initial={club.name}
        maxLength={40}
        open={renamingClub}
        onClose={() => setRenamingClub(false)}
        onSubmit={(name) => {
          clubStore.rename(name);
          return true;
        }}
      />

      <RenameDialog
        title="Edit player"
        label="Player name"
        initial={editing?.name ?? ""}
        maxLength={MAX_PLAYER_NAME_LENGTH}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={(name) =>
          editing ? clubStore.renamePlayer(editing.id, name) : false
        }
      />
    </VStack>
  );
}

function PlayerRow({
  player,
  onEdit,
  onDelete,
}: {
  player: ClubPlayer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card.Root
      borderWidth={1}
      borderColor="card.border"
      bg="card.bg"
      transition="all 0.2s"
      _hover={{ borderColor: "brand.300" }}
    >
      <Card.Body pl={4} pr={2} py={2}>
        <HStack justify="space-between" align="center" gap={2}>
          <VStack align="start" gap={0} minW={0}>
            <Text fontWeight="medium" fontSize="md" truncate>
              {player.name}
            </Text>
            {player.lastPlayedAt && (
              <Text fontSize="xs" color="fg.muted">
                Last played{" "}
                {new Date(player.lastPlayedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            )}
          </VStack>
          <HStack gap={1}>
            <IconButton
              aria-label={`Edit ${player.name}`}
              size="sm"
              variant="ghost"
              colorPalette="brand"
              onClick={onEdit}
            >
              <LuPencil />
            </IconButton>
            <IconButton
              aria-label={`Remove ${player.name}`}
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={onDelete}
            >
              <LuTrash2 />
            </IconButton>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function EmptyPlayers() {
  return (
    <VStack
      gap={2}
      py={10}
      textAlign="center"
      borderRadius="xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
    >
      <Box fontSize="3xl" color="fg.muted" opacity={0.6}>
        <LuUsers />
      </Box>
      <Text fontSize="sm" color="fg.muted" maxW="280px">
        Add everyone you play with. You only type each name once — after that
        you just tap them.
      </Text>
    </VStack>
  );
}

function CreateClub({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <VStack align="stretch" gap={5} py={6}>
      <VStack align="stretch" gap={1}>
        <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          Name your club
        </Text>
        <Text fontSize="sm" color="fg.muted">
          A club is just the group you play with — your Saturday crew. It keeps
          your players and your trophies in one place.
        </Text>
      </VStack>
      <Input
        placeholder="e.g. Solo Premier League"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onCreate(name);
        }}
        maxLength={40}
        size="lg"
        h="48px"
        bg="input.bg"
        borderColor="input.border"
        _placeholder={{ color: "fg.placeholder" }}
        _focus={{
          borderColor: "input.focusBorder",
          boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
        }}
      />
      <Button
        colorPalette="brand"
        size="lg"
        h="48px"
        w="full"
        disabled={!name.trim()}
        onClick={() => onCreate(name)}
      >
        Create club
      </Button>
    </VStack>
  );
}

function RenameDialog({
  title,
  label,
  initial,
  maxLength,
  open,
  onClose,
  onSubmit,
}: {
  title: string;
  label: string;
  initial: string;
  maxLength: number;
  open: boolean;
  onClose: () => void;
  /** Return false to signal the name was rejected (e.g. duplicate). */
  onSubmit: (name: string) => boolean;
}) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [rejected, setRejected] = useState(false);

  // Re-seed when a different subject is opened.
  const current = touched ? value : initial;

  const close = () => {
    setTouched(false);
    setRejected(false);
    onClose();
  };

  const submit = () => {
    const name = current.trim();
    if (!name || name.length > maxLength) return;
    if (!onSubmit(name)) {
      setRejected(true);
      return;
    }
    close();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && close()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="380px"
            bg="dialog.bg"
            borderRadius="xl"
            p={4}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          >
            <Dialog.Header px={2} pb={3}>
              <Text fontSize="lg" fontWeight="500" w="full" textAlign="center">
                {title}
              </Text>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  position="absolute"
                  top={4}
                  right={4}
                  size="sm"
                  color="fg.muted"
                  _hover={{ color: "fg.default", bg: "bg.subtle" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={2}>
              <VStack gap={4} w="full">
                <Box w="full">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    {label}
                  </Text>
                  <Input
                    value={current}
                    onChange={(e) => {
                      setTouched(true);
                      setValue(e.target.value);
                      setRejected(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    maxLength={maxLength}
                    size="lg"
                    autoFocus
                    bg="input.bg"
                    borderColor="input.border"
                    _focus={{
                      borderColor: "input.focusBorder",
                      boxShadow: "0 0 0 1px var(--colors-input-focus-border)",
                    }}
                  />
                  {rejected && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      That name is already used in this club
                    </Text>
                  )}
                </Box>
                <HStack gap={3} w="full">
                  <Button
                    variant="outline"
                    flex="1"
                    h="44px"
                    colorPalette="gray"
                    onClick={close}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorPalette="brand"
                    flex="1"
                    h="44px"
                    onClick={submit}
                    disabled={!current.trim()}
                  >
                    Save
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
