import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

import type { ComponentType } from "react";

/**
 * Series Extension Points Plugin
 * Defines where and how series-specific UI can be extended by plugins
 *
 * Extension Points Defined:
 * - series:table:toolbar-end-actions - Action buttons rendered at end of series table toolbar
 * - series:create-series:variants - Ways to create a series, offered by the create-series dialog
 * - series:create-series:acl-editor - Optional ACL editor for the default create-series variant
 */

/** Registry key for {@link CreateSeriesVariant} objects. */
export const CREATE_SERIES_VARIANTS = "series:create-series:variants";

/**
 * Props the create-series dialog passes to a variant's component. The variant
 * owns the dialog body and footer; the dialog owns the frame, the chooser and
 * what happens after creation.
 */
export interface CreateSeriesVariantProps {
  /**
   * Call with the id of the new series. The dialog closes, invalidates the
   * series list and calls `refetch`.
   */
  onCreated: (seriesId: string) => void;
  /** Back to the chooser, or close the dialog when this is the only variant. */
  onCancel: () => void;
  /** Reloads the series table; prefer `onCreated`, which already does this. */
  refetch?: () => void;
}

/**
 * One way to create a series — a card in the create-series dialog. Register
 * with `manager.registerObject("series:create-series:variants", id, …)`.
 *
 * `core-series` registers the plain metadata form as the variant `default`.
 * The dialog lists every registered variant the current user may use (see
 * `requiredRoles`) that the deployment has not disabled
 * (`plugins.series.seriesTable.createSeries.variants.<id>.enabled`). With one
 * variant left it opens that variant directly; with several it shows a
 * chooser first.
 */
export interface CreateSeriesVariant {
  /**
   * Stable id, also the key under `createSeries.variants` in the config.
   * Prefix it with your plugin name (`acme-course`) to avoid clashes.
   */
  id: string;
  /** Lower comes first in the chooser. Defaults to 100; the default variant uses 100. */
  order?: number;
  /**
   * Caption of the chooser card. A translation key (`namespace:key`) the host
   * resolves at render time; a string without a colon is shown literally.
   */
  label: string;
  /** One sentence under the caption. Same resolution as `label`. */
  description?: string;
  /** Icon on the chooser card. */
  icon?: ComponentType<{ className?: string }>;
  /**
   * When set, the chooser lists the variant only for users holding at least
   * one of these roles (checked against the user's `roles` array, like
   * `AppDefinition.requiredRoles`). Omitted means everyone who sees the button.
   */
  requiredRoles?: string[];
  /** Renders the variant's body and footer inside the dialog. */
  component: ComponentType<CreateSeriesVariantProps>;
}

export const seriesExtensionPoints = createPlugin({
  namespace: "core",
  type: "series",
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
            component: "CreateSeriesAction",
          },
        ],
      },
    );

    manager.registerObject("extension-points:documentation", CREATE_SERIES_VARIANTS, {
      description:
        "A way to create a series, offered as a card by the create-series dialog; the variant renders the dialog body and footer itself",
      expectedSchema: {
        id: "string - Stable id, also the config key under createSeries.variants",
        order: "number - Chooser order (lower = first), default 100",
        label: "string - Translation key (namespace:key) or literal caption",
        description: "string - Optional translation key or literal sentence",
        icon: "React.Component<{ className?: string }> - Optional card icon",
        requiredRoles: "string[] - Optional; shown only to users holding one of these roles",
        component:
          "React.Component<CreateSeriesVariantProps> - Receives onCreated(seriesId), onCancel, refetch",
      },
      examples: [
        {
          id: "default",
          order: 100,
          label: "series:seriesTable.createSeries.variants.default.label",
          component: "DefaultCreateSeriesVariant",
        },
      ],
    });

    manager.registerObject("extension-points:documentation", "series:create-series:acl-editor", {
      description: "Optional ACL editor for the default create-series variant",
      expectedSchema: {
        aclData: "AclData|null - Current ACL configuration",
        onAclDataChange: "function - Callback when ACL data changes",
        selectedSeries: "SelectedElement|null - Selected series context (null during creation)",
        disabled: "boolean - Whether ACL editor is disabled",
        refetch: "function - Optional refetch callback",
      },
      examples: [
        {
          placement: "Inside the default create-series variant",
          description: "Optional policy and entry editor integrated through a plugin",
        },
      ],
    });
  },

  activate() {},

  deactivate() {},
});
