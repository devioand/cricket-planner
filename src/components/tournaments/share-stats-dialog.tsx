"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CloseButton,
  Dialog,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuDownload, LuShare2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useLiveTournament } from "@/contexts/tournament-context/live-provider";
import { StatsCard } from "@/components/tournaments/stats-card";
import {
  downloadDataUrl,
  nextPaint,
  nodeToPng,
  shareOrDownloadImage,
  slugify,
} from "@/components/tournaments/share/capture";

/**
 * Share the tournament stats (points table, awards, highlights) as an image.
 * Previews the generated card and shares it via the native share sheet
 * (WhatsApp etc.) with a download fallback. Fully on-device — no server needed.
 */
export function ShareStatsDialog({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
}) {
  const { state } = useLiveTournament();
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

  // (Re)generate whenever the dialog is open and the underlying data changes.
  useEffect(() => {
    if (!open) return;
    void render();
  }, [open, render, state.matches, state.teamStats]);

  const filename = `${slugify(name)}-stats.png`;

  const handleDownload = () => {
    if (dataUrl) downloadDataUrl(dataUrl, filename);
  };

  const handleShare = async () => {
    if (!dataUrl) return;
    try {
      const { shared } = await shareOrDownloadImage(dataUrl, filename, {
        title: name,
        text: `${name} — stats 🏏`,
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
                Share stats
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
                <Text fontSize="sm" color="fg.muted">
                  Points table, team awards, and match highlights — ready for the
                  group chat.
                </Text>

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
                      alt="Tournament stats preview"
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
                    <LuShare2 /> Share to WhatsApp
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
        <StatsCard ref={cardRef} tournamentName={name} state={state} />
      </Box>
    </Dialog.Root>
  );
}
