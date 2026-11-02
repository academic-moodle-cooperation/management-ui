import { Suspense } from "react";

import { ComponentResolver } from "@oc-mui/plugin-system";
import { AppLoader, Container } from "@oc-mui/ui/components";
import { DefaultLandingPage } from "@oc-mui/ui/internal";

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
