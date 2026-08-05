const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * Human-readable file size. Binary steps, decimal labels — the same convention
 * the rest of the UI uses, and the one users recognise from their file manager.
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  // Whole numbers for bytes, one decimal from KB upwards.
  return `${exponent === 0 ? value : value.toFixed(1)} ${UNITS[exponent]}`;
};
