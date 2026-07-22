"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CloseButton,
  Dialog,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  LuChevronDown,
  LuEllipsisVertical,
  LuInfo,
  LuLayers,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuTrophy,
  LuUsers,
  LuCheck,
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { MAX_PLAYER_NAME_LENGTH } from "@/lib/clubs/types";
import type {
  ClubPlayer,
  ClubSummary,
  ClubWithPlayers,
} from "@/lib/repositories/club-repository";
import * as actions from "@/app/club/actions";

const DEVICE_KEY = "cricket-planner:club";

export function ClubManager({
  active,
  clubs,
}: {
  active: ClubWithPlayers | null;
  clubs: ClubSummary[];
}) {
  if (!active) return <CreateFirstClub />;
  return <ClubBody active={active} clubs={clubs} />;
}

function ClubBody({ active, clubs }: { active: ClubWithPlayers; clubs: ClubSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClubPlayer | null>(null);
  const [renamingClub, setRenamingClub] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [devicePlayers, setDevicePlayers] = useState<string[]>([]);

  // Offer a one-time import of players saved on this device (pre-DB clubs).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEVICE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { club?: { players?: { name: string }[] } };
      setDevicePlayers((parsed.club?.players ?? []).map((p) => p.name).filter(Boolean));
    } catch {
      // ignore an unreadable blob
    }
  }, []);

  const addPlayer = () => {
    const name = draft.trim();
    if (!name) return;
    if (name.length > MAX_PLAYER_NAME_LENGTH) {
      setError(`Keep it to ${MAX_PLAYER_NAME_LENGTH} characters`);
      return;
    }
    setDraft(""); // clear immediately so names can be typed in a run
    setError(null);
    startTransition(async () => {
      const res = await actions.addPlayerAction(active.id, name);
      if (!res.ok) {
        setError(res.error === "duplicate" ? `${name} is already in the club` : "Couldn't add");
      }
      router.refresh();
    });
  };

  return (
    <VStack align="stretch" gap={6} opacity={isPending ? 0.7 : 1} transition="opacity 0.15s">
      {/* Club switcher — every club as a chip, plus New. */}
      <Wrap gap={2}>
        {clubs.map((c) => {
          const on = c.id === active.id;
          return (
            <WrapItem key={c.id}>
              <Box
                as="button"
                onClick={() => !on && run(() => actions.setActiveClubAction(c.id))}
                aria-pressed={on}
                h="36px"
                px={3.5}
                borderRadius="full"
                borderWidth="1px"
                display="flex"
                alignItems="center"
                gap={1.5}
                bg={on ? "brand.500" : "card.bg"}
                color={on ? "white" : "fg.default"}
                borderColor={on ? "brand.500" : "card.border"}
                _hover={on ? {} : { borderColor: "brand.300" }}
              >
                {on && <LuCheck size={14} />}
                <Text fontSize="sm" fontWeight="medium">
                  {c.name}
                </Text>
              </Box>
            </WrapItem>
          );
        })}
        <WrapItem>
          <Box
            as="button"
            onClick={() => setCreating(true)}
            h="36px"
            px={3.5}
            borderRadius="full"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border.default"
            color="brand.fg"
            display="flex"
            alignItems="center"
            gap={1}
            _hover={{ borderColor: "brand.400" }}
          >
            <LuPlus size={14} />
            <Text fontSize="sm" fontWeight="medium">
              New club
            </Text>
          </Box>
        </WrapItem>
      </Wrap>

      {/* Header */}
      <HStack justify="space-between" align="start" gap={3}>
        <Box minW={0}>
          <Text
            fontFamily="heading"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            lineHeight="1.15"
          >
            {active.name}
          </Text>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            {active.players.length === 0
              ? "No players yet"
              : `${active.players.length} ${active.players.length === 1 ? "player" : "players"}`}
          </Text>
        </Box>
        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton aria-label="Club options" size="sm" variant="ghost" colorPalette="gray">
              <LuEllipsisVertical />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="180px">
                <Menu.Item value="rename" onClick={() => setRenamingClub(true)}>
                  <LuPencil />
                  <Box flex="1">Rename club</Box>
                </Menu.Item>
                <Menu.Item
                  value="delete"
                  color={{ base: "red.600", _dark: "red.300" }}
                  onClick={() => setDeleting(true)}
                >
                  <LuTrash2 />
                  <Box flex="1">Delete club</Box>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>

      <HowClubsWork />

      {/* Quick add */}
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
          <Button colorPalette="brand" size="lg" h="48px" px={6} onClick={addPlayer} disabled={!draft.trim()}>
            Add
          </Button>
        </HStack>
        <Text fontSize="xs" color={error ? "red.500" : "fg.muted"} mt={1.5}>
          {error ?? "Press Enter to add another — no account needed."}
        </Text>
      </Box>

      {active.players.length === 0 ? (
        <EmptyPlayers
          deviceCount={devicePlayers.length}
          onImport={() => run(() => actions.importPlayersAction(active.id, devicePlayers))}
        />
      ) : (
        <VStack align="stretch" gap={2}>
          {active.players.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              onEdit={() => setEditing(p)}
              onDelete={() => run(() => actions.removePlayerAction(p.id))}
            />
          ))}
        </VStack>
      )}

      <NameDialog
        title="Rename club"
        label="Club name"
        initial={active.name}
        maxLength={40}
        open={renamingClub}
        onClose={() => setRenamingClub(false)}
        onSubmit={async (name) => {
          await actions.renameClubAction(active.id, name);
          return { ok: true };
        }}
      />

      <NameDialog
        title="New club"
        label="Club name"
        initial=""
        submitLabel="Create"
        maxLength={40}
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (name) => {
          await actions.createClubAction(name);
          return { ok: true };
        }}
      />

      <NameDialog
        title="Edit player"
        label="Player name"
        initial={editing?.name ?? ""}
        maxLength={MAX_PLAYER_NAME_LENGTH}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSubmit={async (name) => {
          if (!editing) return { ok: false };
          const res = await actions.renamePlayerAction(editing.id, name);
          return res.ok ? { ok: true } : { ok: false, error: "That name is already used in this club" };
        }}
      />

      <ConfirmDelete
        open={deleting}
        clubName={active.name}
        onClose={() => setDeleting(false)}
        onConfirm={() => actions.deleteClubAction(active.id)}
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
            <IconButton aria-label={`Edit ${player.name}`} size="sm" variant="ghost" colorPalette="brand" onClick={onEdit}>
              <LuPencil />
            </IconButton>
            <IconButton aria-label={`Remove ${player.name}`} size="sm" variant="ghost" colorPalette="red" onClick={onDelete}>
              <LuTrash2 />
            </IconButton>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

function EmptyPlayers({ deviceCount, onImport }: { deviceCount: number; onImport: () => void }) {
  return (
    <VStack gap={3} py={10} textAlign="center" borderRadius="xl" borderWidth="1px" borderStyle="dashed" borderColor="border.default">
      <Box fontSize="3xl" color="fg.muted" opacity={0.6}>
        <LuUsers />
      </Box>
      <Text fontSize="sm" color="fg.muted" maxW="280px">
        Add everyone you play with. You only type each name once — after that you just tap them.
      </Text>
      {deviceCount > 0 && (
        <Button variant="outline" colorPalette="brand" size="sm" onClick={onImport}>
          Import {deviceCount} from this device
        </Button>
      )}
    </VStack>
  );
}

function ClubExplainer() {
  const points = [
    {
      icon: LuUsers,
      title: "Save your players once",
      body: "Add everyone you play with — next time you just tap who showed up instead of typing names.",
    },
    {
      icon: LuTrophy,
      title: "Trophies & records pile up",
      body: "Every win, champion and rivalry collects under the club, so your group's history is in one place.",
    },
    {
      icon: LuLayers,
      title: "Have more than one",
      body: "A club per crew — office team, neighbourhood crew — each with its own players and trophies.",
    },
  ];
  return (
    <VStack align="stretch" gap={3.5}>
      {points.map((p) => (
        <HStack key={p.title} gap={3} align="start">
          <Box color="brand.fg" mt={0.5} flexShrink={0}>
            <p.icon size={18} />
          </Box>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="semibold" color="fg.default">
              {p.title}
            </Text>
            <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
              {p.body}
            </Text>
          </Box>
        </HStack>
      ))}
      <Text fontSize="xs" color="fg.subtle">
        Name it after your group — like <Text as="span" fontStyle="italic">Solo Premier League</Text> or{" "}
        <Text as="span" fontStyle="italic">Office Cricket</Text>.
      </Text>
    </VStack>
  );
}

/** Collapsible "how it works" — available for newcomers, out of the way for
 *  everyone else. */
function HowClubsWork() {
  const [open, setOpen] = useState(false);
  return (
    <Box borderWidth="1px" borderColor="border.default" borderRadius="xl" overflow="hidden">
      <Box
        as="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        w="full"
        px={4}
        py={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        _hover={{ bg: "bg.subtle" }}
      >
        <HStack gap={2} color="fg.muted">
          <LuInfo size={16} />
          <Text fontSize="sm" fontWeight="medium" color="fg.default">
            How do clubs work?
          </Text>
        </HStack>
        <Box color="fg.muted" transform={open ? "rotate(180deg)" : "none"} transition="transform 0.15s">
          <LuChevronDown size={16} />
        </Box>
      </Box>
      {open && (
        <Box px={4} pb={4}>
          <ClubExplainer />
        </Box>
      )}
    </Box>
  );
}

function CreateFirstClub() {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [name, setName] = useState("");
  const onCreate = (n: string) => {
    if (!n.trim()) return;
    startTransition(async () => {
      await actions.createClubAction(n);
      router.refresh();
    });
  };
  return (
    <VStack align="stretch" gap={5} py={2}>
      <VStack align="stretch" gap={1}>
        <Text fontFamily="heading" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          Start your club
        </Text>
        <Text fontSize="sm" color="fg.muted">
          A club is just the group you play with — your regular crew.
        </Text>
      </VStack>

      <Box borderWidth="1px" borderColor="border.default" borderRadius="xl" p={4}>
        <ClubExplainer />
      </Box>

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
        _focus={{ borderColor: "input.focusBorder", boxShadow: "0 0 0 1px var(--colors-input-focus-border)" }}
      />
      <Button colorPalette="brand" size="lg" h="48px" w="full" loading={busy} disabled={!name.trim()} onClick={() => onCreate(name)}>
        Create club
      </Button>
    </VStack>
  );
}

function NameDialog({
  title,
  label,
  initial,
  maxLength,
  submitLabel = "Save",
  open,
  onClose,
  onSubmit,
}: {
  title: string;
  label: string;
  initial: string;
  maxLength: number;
  submitLabel?: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const current = touched ? value : initial;

  const close = () => {
    setTouched(false);
    setError(null);
    onClose();
  };

  const submit = async () => {
    const name = current.trim();
    if (!name || name.length > maxLength || busy) return;
    setBusy(true);
    const res = await onSubmit(name);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That name can't be used");
      return;
    }
    close();
    router.refresh();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && !busy && close()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="380px" bg="dialog.bg" borderRadius="xl" p={4} boxShadow="0 25px 50px -12px rgba(0,0,0,0.25)">
            <Dialog.Header px={2} pb={3}>
              <Text fontSize="lg" fontWeight="500" w="full" textAlign="center">
                {title}
              </Text>
              <Dialog.CloseTrigger asChild>
                <CloseButton position="absolute" top={4} right={4} zIndex={2} size="sm" color="fg.muted" _hover={{ color: "fg.default", bg: "bg.subtle" }} />
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
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    maxLength={maxLength}
                    size="lg"
                    autoFocus
                    bg="input.bg"
                    borderColor="input.border"
                    _focus={{ borderColor: "input.focusBorder", boxShadow: "0 0 0 1px var(--colors-input-focus-border)" }}
                  />
                  {error && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {error}
                    </Text>
                  )}
                </Box>
                <HStack gap={3} w="full">
                  <Button variant="outline" flex="1" h="44px" colorPalette="gray" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  <Button colorPalette="brand" flex="1" h="44px" onClick={submit} loading={busy} disabled={!current.trim()}>
                    {submitLabel}
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

function ConfirmDelete({
  open,
  clubName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  clubName: string;
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && !busy && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="380px" bg="dialog.bg" borderRadius="xl" p={4}>
            <Dialog.Body p={2}>
              <VStack gap={4} w="full">
                <Text textAlign="center" color="fg.default">
                  Delete <Text as="span" fontWeight="semibold">{clubName}</Text>? Its players and history stay, but the club and its roster are removed.
                </Text>
                <HStack gap={3} w="full">
                  <Button variant="outline" flex="1" h="44px" colorPalette="gray" onClick={onClose} disabled={busy}>
                    Cancel
                  </Button>
                  <Button
                    colorPalette="red"
                    flex="1"
                    h="44px"
                    loading={busy}
                    onClick={async () => {
                      setBusy(true);
                      await onConfirm();
                      setBusy(false);
                      onClose();
                      router.refresh();
                    }}
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
  );
}
