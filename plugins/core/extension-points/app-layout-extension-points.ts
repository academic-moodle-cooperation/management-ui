import { createPlugin, type PluginManager } from "@workspace/plugin-system";

/**
 * App Layout Extension Points Plugin
 * Defines where and how application layout can be extended by universities
 *
 * Extension Points Defined:
 * - app:header-logo - University logo in header
 * - app:header-actions - Actions in the header area
 * - app:footer - Footer content and links
 * - app:branding - Theme colors, styles, etc.
 * - app:config - Application-wide settings
 */
export const appLayoutExtensionPoints = createPlugin({
  namespace: "core",
  type: "app-layout-extension-points",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Document available extension points

    // Register API documentation
    manager.registerObject("extension-points:documentation", "app:header-logo", {
      description: "University logo displayed in the application header",
      expectedSchema: {
        src: "string - Logo image URL",
        alt: "string - Alt text for accessibility",
        width: "number - Logo width (optional)",
        height: "number - Logo height (optional)",
        href: "string - Click destination URL (optional)",
      },
      examples: [
        {
          src: "/assets/univie-logo.png",
          alt: "University of Vienna",
          width: 120,
          height: 40,
          href: import.meta.env["VITE_INSTITUTION_WEBSITE"] || "#",
        },
      ],
    });

    manager.registerObject("extension-points:documentation", "app:header-actions", {
      description: "Action buttons and links in the header area",
      expectedSchema: {
        title: "string - Action title",
        icon: "string|Component - Icon identifier",
        action: "function - Click handler",
        order: "number - Display order",
        permissions: "string[] - Required permissions",
      },
    });

    manager.registerObject("extension-points:documentation", "app:footer", {
      description: "Footer content including links, disclaimers, and contact info",
      expectedSchema: {
        content: "ReactNode - Footer content",
        links: "Array<{title, url, external?}> - Footer links",
        disclaimer: "string - Legal disclaimer text",
        order: "number - Display order",
      },
    });

    manager.registerObject("extension-points:documentation", "app:branding", {
      description: "University-specific theme and branding settings",
      expectedSchema: {
        primaryColor: "string - Primary brand color",
        secondaryColor: "string - Secondary brand color",
        logoUrl: "string - Logo URL",
        faviconUrl: "string - Favicon URL",
        fontFamily: "string - Custom font family",
        customCss: "string - Additional CSS",
      },
    });

    manager.registerObject("extension-points:documentation", "app:config", {
      description: "Application-wide configuration settings",
      expectedSchema: {
        organizationName: "string - University/organization name",
        organizationUrl: "string - University website URL",
        supportEmail: "string - Support contact email",
        privacyPolicyUrl: "string - Privacy policy URL",
        termsOfServiceUrl: "string - Terms of service URL",
        features: "object - Feature flag overrides",
      },
    });
  },

  activate() {},

  deactivate() {},
});
