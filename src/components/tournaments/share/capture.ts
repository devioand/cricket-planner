// Shared capture + share helpers for the image cards.
//
// Kept framework-free (plain functions) so both share dialogs reuse the exact
// same PNG generation and native-share behavior. All rendering happens
// on-device — no server round-trip.

import { toPng } from "html-to-image";
import { CARD_WIDTH } from "./card-style";

/** Filesystem-safe slug for a tournament name (used in the download filename). */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tournament"
  );
}

/** Render a laid-out card node to a PNG data URL at the fixed design width. */
export function nodeToPng(node: HTMLElement): Promise<string> {
  return toPng(node, {
    width: CARD_WIDTH,
    pixelRatio: 1.5,
    cacheBust: true,
  });
}

/** Wait two frames so an off-screen card is laid out & painted before capture. */
export function nextPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

/** Trigger a browser download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Share a PNG via the native share sheet, falling back to a download when the
 * platform can't share files (e.g. desktop browsers). Returns whether the
 * native share sheet was used. Re-throws so callers can special-case the user
 * cancelling the sheet (AbortError).
 */
export async function shareOrDownloadImage(
  dataUrl: string,
  filename: string,
  meta: { title: string; text: string },
): Promise<{ shared: boolean }> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title: meta.title, text: meta.text });
    return { shared: true };
  }
  downloadDataUrl(dataUrl, filename);
  return { shared: false };
}
