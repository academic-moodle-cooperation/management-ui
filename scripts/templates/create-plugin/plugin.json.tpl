{
  "$schema": "https://raw.githubusercontent.com/academic-moodle-cooperation/management-tool/HEAD/packages/plugin-system/src/schemas/plugin.schema.json",
  "id": "__PLUGIN_NAME__",
  "name": "__PLUGIN_NAME__",
  "version": "1.0.0",
  "description": "TODO: describe what this plugin does in one or two sentences.",
  "author": {
    "name": "TODO"
  },
  "namespace": "__PLUGIN_NAME__",
  "type": "header",
  "category": "experimental",
  "apiVersion": "1.0.0",
  "workspaceDependencies": {
    "react": "^19.0.0",
    "@oc-mui/plugin-system": "^1.0.0",
    "@oc-mui/ui": "^1.0.0",
    "@oc-mui/utils": "^1.0.0"
  },
  "extensionPoints": [
    "app:header-logo"
  ]
}
