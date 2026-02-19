// Export utility functions from here
// Example:
// export * from './array-utils';
// export * from './string-utils';

import sha256 from "crypto-js/sha256.js";
import { parse, serialize } from "tinyduration";

import type { Duration } from "tinyduration";

const parseDuration = (duration: string | undefined) => {
  const durationObj: Duration | undefined = duration ? parse(duration) : undefined;

  return `${(durationObj?.hours || "00").toString().padStart(2, "0")}:${(durationObj?.minutes || 0).toString().padStart(2, "0")}:${Math.round(
    durationObj?.seconds || 0,
  )
    .toString()
    .padStart(2, "0")}`;
};

export { parseDuration, serialize as serializeDuration };
export { sha256 };

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
export { logger, Logger } from "./logger.js";
export { normalizeMetadataValue, normalizeMetadataObject } from "./normalizeMetadata.js";
export { getEventStatus, isEventProcessing, hasProcessingEvents } from "./eventStatus.js";

export type { LogLevel, LogContext } from "./logger.js";
