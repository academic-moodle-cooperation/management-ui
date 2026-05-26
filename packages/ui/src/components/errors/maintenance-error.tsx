import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function MaintenanceError({
  onLearnMoreClick,
}: {
  /** Optional handler for the "Learn more" CTA. Button is hidden if absent. */
  onLearnMoreClick?: () => void;
} = {}) {
  return (
    <ErrorPage
      code="503"
      title="Website is under maintenance!"
      description={
        <>
          The site is not available at the moment. <br />
          We&apos;ll be back online shortly.
        </>
      }
      actions={
        onLearnMoreClick ? (
          <Button variant="outline" onClick={onLearnMoreClick}>
            Learn more
          </Button>
        ) : undefined
      }
    />
  );
}
