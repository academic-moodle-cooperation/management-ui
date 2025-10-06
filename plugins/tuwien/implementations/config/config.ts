export const config = {
  app: {
    theme: 'tuwien',
    faviconUrl: '/management-ui/assets/favicon/favicon.svg', // TU Wien custom favicon
    pluginNamespace: [
      // Core namespaces needed for navigation
      "core",
      "episodes",
      "series",
      "upload",
      // Add TU Wien specific namespace
      {
        "tuwien": {
          "types": [
            "config",
            "app",
            "episodes-actions",
            "series-actions",
            "footer",
            "header",
            "landing-page",
            "sidebar",
            "table-sidebar",
            "navigation"
          ]
        },
        "univie": {
          "types": [
            "app",
          ]
        }
      }
    ]
  },
  tobiraUrl: 'https://video.tuwien.ac.at',
  studioUrl: 'https://studio.tuwien.ac.at'
};