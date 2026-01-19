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
      "admin", // Enable admin namespace for marketplace plugin
      {
        univie: {
          types: ["config", "app", "footer", "landing-page", "sidebar", "navigation"],
        },
      },
    ],
  },
};
