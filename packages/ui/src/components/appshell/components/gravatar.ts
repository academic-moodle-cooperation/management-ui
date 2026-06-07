import { sha256 } from "@oc-mui/utils";

/**
 * Build the Gravatar avatar URL for a user's email, or `undefined` when there
 * is no usable email (anonymous user, missing/blank email).
 *
 * The GraphQL `currentUser` field is non-null, so an anonymous user arrives as
 * a user object with a `null` email. Returning `undefined` here keeps the app
 * shell from hashing an empty string and requesting gravatar.com — a needless
 * third-party call that, with `d=404`, is a guaranteed 404 and console error.
 *
 * `d=404` makes Gravatar 404 when the user has no avatar so the caller can fall
 * back to initials, rather than serving Gravatar's generic default image.
 */
export function gravatarAvatarUrl(email: string | null | undefined): string | undefined {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) return undefined;

  return `https://www.gravatar.com/avatar/${sha256(normalizedEmail)}?s=64&d=404`;
}
