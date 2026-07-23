"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { deleteTournamentAction } from "@/app/tournaments/actions";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import type { TournamentSummary } from "@/lib/repositories/tournament-repository";

export function TournamentsList({
  tournaments,
}: {
  tournaments: TournamentSummary[];
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<TournamentSummary | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

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
            <Heading size={{ base: "lg", md: "xl" }} fontFamily="heading">
              History
            </Heading>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Everything you&apos;ve played.
            </Text>
          </Box>
          <Link href="/tournaments/new">
            <Button colorPalette="brand">
              <HStack gap={2}>
                <LuPlus />
                <Text>Start playing</Text>
              </HStack>
            </Button>
          </Link>
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
            <Heading size="md" mb={2} fontFamily="heading">
              Nothing played yet
            </Heading>
            <Text color="fg.muted" mb={6}>
              Your games will show up here once you&apos;ve played one.
            </Text>
            <Link href="/tournaments/new">
              <Button colorPalette="brand" size="lg">
                <HStack gap={2}>
                  <LuPlus />
                  <Text>Start playing</Text>
                </HStack>
              </Button>
            </Link>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onDelete={setDeleteTarget}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Delete confirmation */}
      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(e) => !e.open && !isDeleting && setDeleteTarget(null)}
      >
        <Portal>
          <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
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
                  <Text fontSize="lg" fontWeight="500" color={{ base: "red.600", _dark: "red.300" }}>
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
                    color={{ base: "red.600", _dark: "red.300" }}
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
