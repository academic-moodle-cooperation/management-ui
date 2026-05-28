import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function ForbiddenError({
  onHomeClick,
  onBackClick,
}: {
  onHomeClick?: () => void;
  onBackClick?: () => void;
}) {
  return (
    <ErrorPage
      code="403"
      title="Access Forbidden"
      description={
        <>
          You don&apos;t have necessary permission <br />
          to view this resource.
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
