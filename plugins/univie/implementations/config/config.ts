export const config = {
  app: {
    theme: "univie",
    orgLogoUrl: "assets/univie/logo.png",
    studioUrl: "https://admin.oc.univie.ac.at/studio",
    captureUrl: "https://admin.oc.univie.ac.at/capture-ui",
    pluginNamespace: [
      "core",
      "episodes",
      "series",
      "upload",
      {
        univie: {
          types: ["config", "app", "footer", "landing-page", "sidebar", "navigation"],
        },
      },
    ],
  },
};
