export const config = {
  app: {
    theme: 'tuwien',
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
        }
      }
    ]
  },
  tobiraUrl: 'https://video.tuwien.ac.at',
  studioUrl: 'https://studio.tuwien.ac.at'
};