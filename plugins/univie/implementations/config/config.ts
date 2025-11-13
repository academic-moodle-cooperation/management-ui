export const config = {
  app: {
    theme: 'univie',
    orgLogoUrl: 'assets/univie/logo.png',
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
            'sidebar'
          ]
        }
      }
    ]
  }
};






