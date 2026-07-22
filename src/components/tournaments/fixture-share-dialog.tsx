"use client";

// Decoupled fixture-share dialog: renders the FixtureCard off-screen, captures
// it to a PNG, and shares it via the native share sheet (WhatsApp etc.) with a
// download fallback. Takes name + state as PROPS (no live-tournament context),
// so it works both in the creation wizard (from an in-memory preview state) and
// after creation. `topSlot` lets a caller add a control above the preview (the
// live version uses it for the match-window editor).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  CloseButton,
  Dialog,
  Portal,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { LuDownload, LuShare2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import type { TournamentState } from "@/contexts/tournament-context/types";
import { FixtureCard } from "@/components/tournaments/fixture-card";
import {
  downloadDataUrl,
  nextPaint,
  nodeToPng,
  shareOrDownloadImage,
  slugify,
} from "@/components/tournaments/share/capture";

export function FixtureShareDialog({
  open,
  onClose,
  name,
  state,
  topSlot,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  state: TournamentState;
  topSlot?: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const render = useCallback(async () => {
    const node = cardRef.current;
    if (!node) return;
    setRendering(true);
    try {
      await nextPaint();
      setDataUrl(await nodeToPng(node));
    } catch {
      toaster.create({
        title: "Couldn't build the image",
        description: "Please try again.",
        type: "error",
        duration: 3500,
      });
    } finally {
      setRendering(false);
    }
  }, []);

  // (Re)generate whenever the dialog is open and the schedule/teams/matches change.
  useEffect(() => {
    if (!open) return;
    void render();
  }, [
    open,
    render,
    state.scheduledStart,
    state.scheduledEnd,
    state.teams,
    state.matches,
  ]);

  const filename = `${slugify(name)}-fixtures.png`;

  const handleDownload = () => {
    if (dataUrl) downloadDataUrl(dataUrl, filename);
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const { shared } = await shareOrDownloadImage(dataUrl, filename, {
        title: name,
        text: `${name} — fixtures`,
      });
      if (!shared) {
        toaster.create({
          title: "Image downloaded",
          description: "Sharing isn't supported here — attach the saved image.",
          type: "info",
          duration: 3500,
        });
      }
    } catch (err) {
      // A user cancelling the share sheet throws AbortError — ignore it.
      if (err instanceof DOMException && err.name === "AbortError") return;
      toaster.create({
        title: "Couldn't share",
        description: "Try downloading the image instead.",
        type: "error",
        duration: 3500,
      });
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop bg="dialog.backdrop" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content maxW="480px" mx={4} bg="dialog.bg" borderRadius="xl">
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="lg" fontWeight="600">
                Share fixture
              </Dialog.Title>
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

            <Dialog.Body pb={5}>
              <VStack align="stretch" gap={5}>
                {topSlot}

                {/* Preview */}
                <Box
                  position="relative"
                  bg="bg.subtle"
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="border.subtle"
                  overflow="hidden"
                  minH="140px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dataUrl}
                      alt="Fixture card preview"
                      style={{ width: "100%", display: "block" }}
                    />
                  ) : (
                    <Spinner size="md" color="fg.muted" />
                  )}
                  {rendering && dataUrl && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      bg="bg.canvas"
                      borderRadius="full"
                      p={1.5}
                    >
                      <Spinner size="xs" color="fg.muted" />
                    </Box>
                  )}
                </Box>

                {/* Actions */}
                <VStack align="stretch" gap={2.5}>
                  <Button
                    colorPalette="brand"
                    size="lg"
                    onClick={handleShare}
                    disabled={!dataUrl || rendering}
                  >
                    <LuShare2 /> Share
                  </Button>
                  <Button
                    variant="outline"
                    colorPalette="gray"
                    size="lg"
                    onClick={handleDownload}
                    disabled={!dataUrl || rendering}
                  >
                    <LuDownload /> Download image
                  </Button>
                </VStack>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>

      {/* Off-screen full-size render target for the PNG capture. */}
      <Box position="fixed" top={0} left="-99999px" pointerEvents="none" aria-hidden>
        <FixtureCard ref={cardRef} tournamentName={name} state={state} />
      </Box>
    </Dialog.Root>
  );
}
