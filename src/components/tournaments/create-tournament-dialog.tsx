"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Dialog,
  Portal,
  CloseButton,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuCheck } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { createTournamentAction } from "@/app/tournaments/actions";
import type { TournamentType } from "@/contexts/tournament-context/types";

interface FormatOption {
  id: TournamentType;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

const FORMATS: FormatOption[] = [
  {
    id: "round-robin",
    name: "Round Robin",
    icon: "🔄",
    description: "Everyone plays everyone, then playoffs",
    available: true,
  },
  {
    id: "single-elimination",
    name: "Single Elimination",
    icon: "⚡",
    description: "One loss and you're out",
    available: false,
  },
  {
    id: "double-elimination",
    name: "Double Elimination",
    icon: "🔥",
    description: "Two brackets, second chances",
    available: false,
  },
  {
    id: "triple-elimination",
    name: "Triple Elimination",
    icon: "🏆",
    description: "Maximum chances to win",
    available: false,
  },
];

export function CreateTournamentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [format, setFormat] = useState<TournamentType>("round-robin");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setFormat("round-robin");
      setName("");
    }
  }, [open]);

  const close = () => {
    if (!isCreating) onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const { id } = await createTournamentAction({
        name: name.trim(),
        algorithm: format,
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

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && close()}>
      <Portal>
        <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="460px"
            bg="dialog.bg"
            borderRadius="xl"
            p={4}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          >
            <Dialog.Header px={2} pb={2}>
              <Text fontSize="lg" fontWeight="600">
                New Tournament
              </Text>
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
              <VStack gap={5} align="stretch">
                {/* Format selector */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    mb={2}
                    color="fg.default"
                  >
                    Format
                  </Text>
                  <VStack gap={2} align="stretch">
                    {FORMATS.map((f) => {
                      const selected = f.available && format === f.id;
                      return (
                        <Box
                          key={f.id}
                          role="button"
                          aria-disabled={!f.available}
                          aria-pressed={selected}
                          onClick={
                            f.available ? () => setFormat(f.id) : undefined
                          }
                          textAlign="left"
                          p={3}
                          borderWidth={selected ? 2 : 1}
                          borderRadius="lg"
                          colorPalette="blue"
                          borderColor={
                            selected ? "colorPalette.500" : "border.default"
                          }
                          bg={selected ? "colorPalette.100" : "card.bg"}
                          cursor={f.available ? "pointer" : "not-allowed"}
                          opacity={f.available ? 1 : 0.6}
                          transition="all 0.15s"
                          _hover={
                            f.available && !selected
                              ? { borderColor: "colorPalette.300" }
                              : {}
                          }
                        >
                          <HStack justify="space-between" align="center">
                            <HStack gap={3} align="center">
                              <Text fontSize="xl" lineHeight="1">
                                {f.icon}
                              </Text>
                              <Box>
                                <Text
                                  fontWeight="medium"
                                  fontSize="sm"
                                  color="fg.default"
                                >
                                  {f.name}
                                </Text>
                                <Text fontSize="xs" color="fg.muted">
                                  {f.description}
                                </Text>
                              </Box>
                            </HStack>
                            {f.available ? (
                              selected ? (
                                <Box color="colorPalette.500" display="flex">
                                  <LuCheck />
                                </Box>
                              ) : null
                            ) : (
                              <Badge
                                colorPalette="gray"
                                variant="subtle"
                                fontSize="xs"
                                flexShrink={0}
                              >
                                Soon
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Name */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    mb={2}
                    color="fg.default"
                  >
                    Tournament Name
                  </Text>
                  <Input
                    placeholder="e.g. Summer Cup 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim() && !isCreating) {
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

                {/* Actions */}
                <HStack gap={3} w="full">
                  <Button
                    variant="outline"
                    flex="1"
                    size="md"
                    h="44px"
                    borderRadius="lg"
                    colorPalette="gray"
                    onClick={close}
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
                    onClick={handleCreate}
                    disabled={!name.trim()}
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
  );
}
