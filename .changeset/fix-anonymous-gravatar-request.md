---
"@oc-mui/ui": patch
---

Stop the app shell from requesting a Gravatar avatar when there is no
logged-in user.

The GraphQL `currentUser` field is non-null, so an anonymous visitor arrives
as a user object with a `null` email. The nav-user shell hashed that empty
email and built `https://www.gravatar.com/avatar/<hash-of-"">?s=64&d=404`,
firing a request to gravatar.com (a third party) for every anonymous page
load — a needless privacy leak that, because `d=404` asks Gravatar to 404
rather than serve a default image, was a guaranteed 404 and console error.

The Gravatar URL is now built by a small `gravatarAvatarUrl` helper that
returns `undefined` for a missing/blank email, so the shell only contacts
gravatar.com for an authenticated user with an email and otherwise falls back
to the avatar initials. Adds a unit test covering the no-email cases.
