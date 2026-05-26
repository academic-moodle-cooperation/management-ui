import { Button } from "../ui/button";

import { ErrorPage } from "./error-page";

export function UnauthorisedError({
  onBackClick,
  onHomeClick,
}: {
  onBackClick?: () => void;
  onHomeClick?: () => void;
}) {
  return (
    <ErrorPage
      code="401"
      title="Unauthorized Access"
      description={
        <>
          Please log in with the appropriate credentials <br /> to access this resource.
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
