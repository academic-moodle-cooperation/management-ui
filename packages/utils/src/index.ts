// Export utility functions from here
// Example:
// export * from './array-utils';
// export * from './string-utils';

import sha256 from "crypto-js/sha256.js";
import { parse, Duration, serialize } from "tinyduration";

const parseDuration = (duration: string | undefined) => {
  const durationObj: Duration | undefined = duration
    ? parse(duration)
    : undefined;

  return `${(durationObj?.hours || "00").toString().padStart(2, "0")}:${(durationObj?.minutes || 0).toString().padStart(2, "0")}:${Math.round(
    durationObj?.seconds || 0
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
    if (typeof navigator === 'undefined') return false;
    return navigator.userAgent.match(/ipad|iphone/i);
  }

  function copyToClipboard() {
    // Check if running in a browser environment before accessing document
    if (typeof document === 'undefined') return;
    const input = document.createElement("input");
    input.setAttribute("id", "copy-text");
    input.setAttribute("type", "text");
    input.setAttribute(
      "style",
      "position: absolute; left: -1000px; top: -1000px"
    );
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
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      copyToClipboard();
      resolve(true);
      return;
    }

    navigator.permissions
      .query({ name: permissionName })
      .then((result) => {
        if (result.state == "granted" || result.state == "prompt") {
          navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => {
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



/**
 * Normalizes metadata values from GraphQL responses
 * Converts null, undefined, and "null" strings to empty strings for consistent handling
 */
export function normalizeMetadataValue(value: unknown): string | string[] {
  // Handle null, undefined, or "null" string
  if (value === null || value === undefined || value === "null") {
    return "";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => {
      if (item === null || item === undefined || item === "null") {
        return "";
      }
      return String(item);
    }).filter(item => item !== ""); // Remove empty strings from arrays
  }

  // Handle other values
  return String(value);
}

/**
 * Normalizes an entire metadata object, removing empty values
 */
export function normalizeMetadataObject(metadata: Record<string, unknown>): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};

  Object.entries(metadata).forEach(([key, value]) => {
    const normalizedValue = normalizeMetadataValue(value);

    // Only include non-empty values
    if (normalizedValue !== "" &&
      !(Array.isArray(normalizedValue) && normalizedValue.length === 0)) {
      normalized[key] = normalizedValue;
    }
  });

  return normalized;
}

export { resolveAssetUrl, resolveFirstAssetUrl } from './assetUrl';
export { deepMerge } from './deepMerge';
export { logger, Logger } from './logger';
export type { LogLevel, LogContext } from './logger';