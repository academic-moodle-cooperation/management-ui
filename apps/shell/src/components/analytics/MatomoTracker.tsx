import { useEffect, useRef } from "react";

import { useAppConfig } from "@workspace/query";
import { useRouterState } from "@workspace/router";

import { initializeMatomo, trackMatomoPageView } from "../../services/matomo";

export const MatomoTracker = () => {
  const { config } = useAppConfig();
  const href = useRouterState({
    select: (state) => state.location.href,
  });
  const previousHrefRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    initializeMatomo(config.matomo);
  }, [config.matomo]);

  useEffect(() => {
    const previousHref = previousHrefRef.current;
    previousHrefRef.current = href;

    trackMatomoPageView(config.matomo, {
      href,
      previousHref,
      title: document.title,
    });
  }, [config.matomo, href]);

  return null;
};
