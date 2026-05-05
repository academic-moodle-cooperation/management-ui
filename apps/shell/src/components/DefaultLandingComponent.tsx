import { Suspense } from "react";

import { ComponentResolver } from "@workspace/plugin-system";
import { DefaultLandingPage, AppLoader, Container } from "@workspace/ui/components";

export const DefaultLandingComponent = () => (
  <Suspense fallback={<AppLoader />}>
    <Container className="flex justify-center h-full w-full">
      <ComponentResolver
        componentType="appshell:landing-page"
        defaultComponent={DefaultLandingPage}
        componentProps={{}}
        loadingBehavior="loader"
        useOverridePrefix={true}
      />
    </Container>
  </Suspense>
);
