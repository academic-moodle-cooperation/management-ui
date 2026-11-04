/**
 * Ids of files whose `opencastUpload` is currently running.
 *
 * Module scope on purpose. The upload app is unmounted when the user navigates
 * to another route and mounted again on the way back, while the upload itself
 * keeps running in the background. Without this register the re-mounted app
 * saw `pending` + `next` set in the store and started a second (and, after the
 * series id churned through the mount effects, a third and fourth) upload of
 * the very same file — duplicate episodes, some of them without a series.
 *
 * Deliberately *not* in the persisted store: after a reload the requests are
 * gone, so a persisted "in flight" flag would block that file forever.
 */
const inFlight = new Set<number>();

/** Returns `true` if the caller may start the upload for `id`, `false` if one is already running. */
export const claimUpload = (id: number): boolean => {
  if (inFlight.has(id)) return false;
  inFlight.add(id);
  return true;
};

export const releaseUpload = (id: number): void => {
  inFlight.delete(id);
};

export const isUploadInFlight = (id: number): boolean => inFlight.has(id);
