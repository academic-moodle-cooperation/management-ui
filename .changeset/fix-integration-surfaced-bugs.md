---
"@opencast-mui/ui": patch
"@opencast-mui/plugin-core-upload": patch
---

Fix two issues surfaced by real-backend integration testing:

- **ui**: stop requesting a Gravatar avatar in the sidebar user menu. It leaked
  a hash of the user's email to gravatar.com (counter to the project's
  GDPR/offline stance) and 404'd for any user without a Gravatar; the initials
  fallback is unchanged.
- **upload**: stop misusing Radix `asChild` onto a `React.Fragment` in the
  dropzone, which warned and silently dropped the wrapper's classes.
