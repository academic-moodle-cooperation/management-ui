interface ResolveDownloadUrlOptions {
  baseUrl?: string | null | undefined;
  logicalName?: string | null | undefined;
  fallbackUrl?: string | null | undefined;
}

export function resolveDownloadUrl({
  baseUrl,
  logicalName,
  fallbackUrl,
}: ResolveDownloadUrlOptions): string {
  const normalizedBaseUrl = baseUrl?.trim();
  const normalizedLogicalName = logicalName?.trim();

  if (normalizedBaseUrl && normalizedLogicalName) {
    return `${normalizedBaseUrl.replace(/\/+$/, "")}/${normalizedLogicalName.replace(/^\/+/, "")}`;
  }

  return fallbackUrl?.trim() ?? "";
}
