import type { Track, TrackHandle } from "../model/types";

/**
 * The transport is the only part of the upload that differs between the
 * "stream straight to Opencast" path and a future resumable one.
 *
 * The UI reads `capabilities` and hides controls it cannot honour, so adding a
 * resumable transport later changes no component. Everything else — media
 * package lifecycle, metadata, ACL, workflow selection — is transport-agnostic
 * because Opencast attaches all of that at `/ingest/ingest` time, long after
 * the bytes have moved.
 */

export type TransportCapabilities = {
  /** Can a partially transferred track continue where it stopped? */
  resumable: boolean;
  /** Can a running transfer be suspended without losing progress? */
  pausable: boolean;
};

export type SendContext = {
  /** Current media package XML; the transport returns the updated one. */
  mediaPackage: string;
  signal: AbortSignal;
  onProgress: (bytesSent: number) => void;
};

export type SendResult = {
  /** Media package XML after the track was attached. */
  mediaPackage: string;
};

export interface UploadTransport {
  readonly kind: string;
  readonly capabilities: TransportCapabilities;

  /**
   * Transfer one track and attach it to the media package. Must reject with an
   * `AbortError` when `ctx.signal` fires, and must not buffer the file.
   */
  send(track: Track, ctx: SendContext): Promise<SendResult>;

  /** Only defined when `capabilities.pausable`. */
  pause?(handle: TrackHandle): void;
  resume?(handle: TrackHandle, ctx: SendContext): Promise<SendResult>;
}

export class UploadAbortedError extends Error {
  constructor() {
    super("upload aborted");
    this.name = "AbortError";
  }
}
