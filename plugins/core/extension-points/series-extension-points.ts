import { createPlugin, type PluginManager } from "@workspace/plugin-system";

/**
 * Series Extension Points Plugin
 * Defines where and how series-specific UI can be extended by plugins
 *
 * Extension Points Defined:
 * - series:table:toolbar-end-actions - Action buttons rendered at end of series table toolbar
 * - series:create-series:acl-editor - Optional ACL editor for create-series dialog
 */
export const seriesExtensionPoints = createPlugin({
  namespace: "core",
  type: "series-extension-points",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject(
      "extension-points:documentation",
      "series:table:toolbar-end-actions",
      {
        description: "Action buttons rendered at the end of the series table toolbar",
        expectedSchema: {
          id: "string - Unique action identifier",
          order: "number - Display order (lower = left)",
          component: "React.Component<{ refetch?: () => void }> - Toolbar action component",
        },
        examples: [
          {
            id: "create-series",
            order: 100,
            component: "CreateSeriesToolbarAction",
          },
        ],
      },
    );

    manager.registerObject("extension-points:documentation", "series:create-series:acl-editor", {
      description: "Optional ACL editor for the create-series dialog",
      expectedSchema: {
        aclData: "AclData|null - Current ACL configuration",
        onAclDataChange: "function - Callback when ACL data changes",
        selectedSeries: "SelectedElement|null - Selected series context (null during creation)",
        disabled: "boolean - Whether ACL editor is disabled",
        refetch: "function - Optional refetch callback",
      },
      examples: [
        {
          placement: "Inside create-series dialog",
          description: "Optional policy and entry editor integrated through a plugin",
        },
      ],
    });
  },

  activate() {},

  deactivate() {},
});
