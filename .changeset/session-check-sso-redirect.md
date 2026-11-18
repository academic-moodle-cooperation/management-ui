---
"@oc-mui/query": patch
"@oc-mui/router": patch
---

Opening a protected page without a session now leads to the login page on backends that answer anonymous API requests with a redirect to a single-sign-on login. Before, the browser followed that redirect into a cross-origin failure and the app showed the 503 "Couldn't verify your session" page. A 401/403 from the session check with no user is also redirected to login now instead of staying on "Checking authentication…".
