import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { Button } from "@oc-mui/ui/components";

import { buildJoinUrl } from "../lib/joinUrl";

/** The large join code + copyable/openable audience link shown to a room. */
export function JoinCode({ code }: { code: string }) {
  const { t } = useTranslation("live-polls");
  const [copied, setCopied] = useState(false);
  const url = buildJoinUrl(code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the URL is visible to copy by hand.
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {t("present.join.code")}
      </span>
      <span className="font-mono text-5xl font-bold tracking-[0.25em] text-primary">{code}</span>
      <span className="max-w-full truncate text-xs text-muted-foreground" title={url}>
        {url}
      </span>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy aria-hidden="true" />
          {copied ? t("present.join.copied") : t("present.join.copyLink")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, "_blank", "noopener")}
        >
          <ExternalLink aria-hidden="true" />
          {t("present.join.openParticipant")}
        </Button>
      </div>
    </div>
  );
}
