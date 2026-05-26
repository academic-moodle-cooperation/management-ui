import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function NotFoundError({
  onBackClick,
  onHomeClick,
}: {
  onBackClick?: () => void;
  onHomeClick?: () => void;
}) {
  return (
    <ErrorPage
      code="404"
      title="Oops! Page Not Found!"
      description={
        <>
          It seems like the page you&apos;re looking for <br />
          does not exist or might have been removed.
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={onBackClick}>
            Go Back
          </Button>
          <Button onClick={onHomeClick}>Back to Home</Button>
        </>
      }
    />
  );
}
