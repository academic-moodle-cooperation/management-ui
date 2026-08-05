import { UploadAbortedError } from "./types";

import type { SendContext, SendResult, UploadTransport } from "./types";
import type { Track } from "../model/types";


/**
 * Release-1 transport: POST the file straight to `/ingest/addTrack`.
 *
 * The one thing that matters here is that `track.file` goes into the `FormData`
 * untouched. A `File` is a disk-backed reference, and both `fetch` and `XHR`
 * stream it without materialising it — which is why a 10 GB upload costs
 * roughly nothing in JS heap. Upload v1 failed exactly here: it round-tripped
 * the file through a blob URL and rebuilt it from an array of chunks, putting
 * the whole thing in memory.
 *
 * `XMLHttpRequest` rather than `fetch` because it is still the only portable
 * way to observe *upload* progress. `fetch` reports download progress only;
 * request-body streams are not available across the browsers we support.
 *
 * No resume: a dropped connection restarts the file. Opencast's ingest API has
 * no offset or chunk endpoint to resume against, so that capability needs a
 * server-side counterpart — see the tus transport.
 */
export const ingestXhrTransport: UploadTransport = {
  kind: "ingest",

  capabilities: {
    resumable: false,
    pausable: false,
  },

  send(track: Track, ctx: SendContext): Promise<SendResult> {
    return new Promise<SendResult>((resolve, reject) => {
      const body = new FormData();
      body.append("mediaPackage", ctx.mediaPackage);
      body.append("flavor", track.flavor);
      body.append("tags", "");
      // The File itself — not a copy of its bytes.
      body.append("BODY", track.file, track.file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/ingest/addTrack");

      const onAbort = () => xhr.abort();
      ctx.signal.addEventListener("abort", onAbort, { once: true });

      const cleanup = () => ctx.signal.removeEventListener("abort", onAbort);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) ctx.onProgress(event.loaded);
      };

      xhr.onload = () => {
        cleanup();
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ mediaPackage: xhr.responseText });
        } else {
          reject(new Error(`/ingest/addTrack responded ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        cleanup();
        reject(new Error("network error during addTrack"));
      };

      xhr.onabort = () => {
        cleanup();
        reject(new UploadAbortedError());
      };

      xhr.send(body);
    });
  },
};
