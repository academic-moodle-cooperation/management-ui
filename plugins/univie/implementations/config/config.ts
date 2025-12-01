export const config = {
  app: {
    theme: 'univie',
    orgLogoUrl: 'assets/univie/logo.png',
    studioUrl: 'https://admin.oc.univie.ac.at/studio',
    pluginNamespace: [
      'core',
      'episodes',
      'series',
      'upload',
      {
        univie: {
          types: [
            'config',
            'app',
            'footer',
            'landing-page',
            'sidebar',
            'navigation'
          ]
        }
      }
    ]
  }
};






