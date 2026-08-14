/**
 * URL validation helpers.
 *
 * Playlist, EPG and stream addresses are supplied by the user or by remote
 * playlist content, and end up in `fetch()` and in `<video>.src`. Only plain
 * web addresses are ever legitimate here, so anything else is rejected before
 * it reaches a network or media sink.
 */

const FETCHABLE_PROTOCOLS = ['http:', 'https:'];
const PLAYABLE_PROTOCOLS = ['http:', 'https:', 'blob:'];

function parse(raw: string): URL | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

/** True when the value is a well-formed http(s) address safe to request. */
export function isSafeFetchUrl(raw: string): boolean {
  const url = parse(raw);
  return !!url && FETCHABLE_PROTOCOLS.includes(url.protocol);
}

/** True when the value is safe to hand to a media element as a source. */
export function isSafePlaybackUrl(raw: string): boolean {
  const url = parse(raw);
  return !!url && PLAYABLE_PROTOCOLS.includes(url.protocol);
}

/** True when the address is http:// and would therefore travel unencrypted. */
export function isInsecureHttpUrl(raw: string): boolean {
  const url = parse(raw);
  return !!url && url.protocol === 'http:';
}

/**
 * Throws a user-safe error when the address is not a usable web address.
 * `label` names the field for the message, e.g. "Server URL".
 */
export function assertSafeFetchUrl(raw: string, label: string): void {
  if (!isSafeFetchUrl(raw)) {
    throw new Error(`${label} must be a valid http:// or https:// web address.`);
  }
}
