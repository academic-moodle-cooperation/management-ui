---
"@oc-mui/plugin-system": minor
"@oc-mui/router": minor
"@oc-mui/ui": minor
"@oc-mui/plugin-admin-marketplace": minor
---

Restrict the plugin marketplace to administrators and gate developer URL loading.

The marketplace loads and executes third-party code at runtime, so it is now
admin-only:

- `AppDefinition.requiredRoles` (plugin-system) and `AppProtectionConfig.requiredRoles`
  (router) let an app declare the roles allowed to open its route. `AppProtection`
  enforces them against the user's *granted* roles (the `roles` array from Opencast's
  `/info/me.json`) — not the per-user `ROLE_USER_<username>` identity role — and shows
  an access-denied screen to authenticated users who lack the role. A deployment can
  override an app's roles via `config.plugins[<id>].protection.requiredRoles` (e.g. a
  non-default admin role).
- The app sidebar (ui) hides nav entries whose `requiredRoles` the current user does
  not hold, so role-gated routes no longer surface a dead link.
- The admin marketplace declares `requiredRoles: ["ROLE_ADMIN"]` (Opencast's default
  admin role) on its routes and nav item, and its developer "load from URL" flow now
  requires an explicit per-visit risk acknowledgement before it will run untrusted code.
