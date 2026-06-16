import { Suspense } from "react";

import { ComponentResolver } from "@opencast-mui/plugin-system";
import { DefaultLandingPage, AppLoader, Container } from "@opencast-mui/ui/components";

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
