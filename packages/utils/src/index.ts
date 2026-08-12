// Export utility functions from here
// Example:
// export * from './array-utils';
// export * from './string-utils';

import { parse, serialize } from "tinyduration";

import type { Duration } from "tinyduration";

const parseDuration = (duration: string | undefined): string => {
  let durationObj: Duration | undefined;
  if (duration) {
    try {
      durationObj = parse(duration);
    } catch {
      // Not ISO 8601 — tinyduration throws, and a throw inside a table cell
      // renderer unmounts the whole module via the nearest error boundary
      // (#253). Return the raw value instead: one odd cell, page intact.
      return duration;
    }
  }

  return `${(durationObj?.hours || "00").toString().padStart(2, "0")}:${(durationObj?.minutes || 0).toString().padStart(2, "0")}:${Math.round(
    durationObj?.seconds || 0,
  )
    .toString()
    .padStart(2, "0")}`;
};

export { parseDuration, serialize as serializeDuration };

/**
 * cyrb53 (public domain, bryc) — a fast 53-bit string hash. Not SHA-256 and
 * not cryptographic; exists solely as the insecure-context fallback below.
 */
const cyrb53 = (input: string, seed = 0): number => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/**
 * SHA-256 hash of a string, returned as lowercase hex. Uses the platform Web
 * Crypto API (no dependency). Intended for non-cryptographic hashing
 * (cache keys, stable ids), not password/secret handling.
 *
 * `crypto.subtle` only exists in secure contexts (HTTPS or localhost). On a
 * plain-HTTP deployment this falls back to a cyrb53-based hash — still stable
 * and well-distributed, but shorter and NOT SHA-256, so treat the output as an
 * opaque id rather than a verifiable digest.
 *
 * @example const id = await sha256("some-key");
 */
export const sha256 = async (input: string): Promise<string> => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return [cyrb53(input, 0), cyrb53(input, 1)]
    .map((n) => n.toString(16).padStart(14, "0"))
    .join("");
};

export const copyText = async (text: string) => {
  const permissionName = "clipboard-write" as PermissionName;

  function isOS() {
    // Check if running in a browser environment before accessing navigator
    if (typeof navigator === "undefined") return false;
    return navigator.userAgent.match(/ipad|iphone/i);
  }

  function copyToClipboard() {
    // Check if running in a browser environment before accessing document
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.setAttribute("id", "copy-text");
    input.setAttribute("type", "text");
    input.setAttribute("style", "position: absolute; left: -1000px; top: -1000px");
    document.body.appendChild(input);
    input.value = text;
    input.focus();
    if (isOS()) {
      const range = document.createRange();
      range.selectNodeContents(input);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      input.setSelectionRange(0, 999999);
    } else {
      input.select();
    }
    document.execCommand("copy");
    document.body.removeChild(input);
  }

  return new Promise<boolean>((resolve) => {
    // Check if running in a browser environment before accessing navigator
    if (typeof navigator === "undefined" || !navigator.permissions) {
      copyToClipboard();
      resolve(true);
      return;
    }

    navigator.permissions
      .query({ name: permissionName })
      .then((result) => {
        if (result.state == "granted" || result.state == "prompt") {
          navigator.clipboard
            .writeText(text)
            .then(() => resolve(true))
            .catch(() => {
              // Fallback if writeText fails even after permission granted (e.g. in older browsers or specific contexts)
              copyToClipboard();
              resolve(true);
            });
        } else {
          // Fallback if permission is denied or in other states
          copyToClipboard();
          resolve(true);
        }
      })
      .catch(() => {
        copyToClipboard();
        resolve(true);
      });
  });
};

export { resolveAssetUrl, resolveFirstAssetUrl } from "./assetUrl.js";
export { deepMerge } from "./deepMerge.js";
export { buildDownloadFileName } from "./downloadFileName.js";
export { resolveDownloadUrl } from "./downloadUrl.js";
export { logger, Logger } from "./logger.js";
export { normalizeMetadataValue, normalizeMetadataObject } from "./normalizeMetadata.js";
export { getEventStatus, isEventProcessing, hasProcessingEvents } from "./eventStatus.js";

export type { LogLevel, LogContext } from "./logger.js";
