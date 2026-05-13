/** Max stored PNG data URL length (~1.1MB base64) */
const MAX_DATA_URL_LENGTH = 1_200_000;
/** Small but non-trivial PNG data URLs from a minimal stroke (~1–3KB base64) */
const MIN_DATA_URL_LENGTH = 900;

/**
 * Accept only PNG data URLs from our canvas client to reduce abuse surface.
 */
export function isValidSignaturePngDataUrl(value: string | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const t = value.trim();
  if (!t.startsWith("data:image/png;base64,")) return false;
  if (t.length < MIN_DATA_URL_LENGTH || t.length > MAX_DATA_URL_LENGTH) return false;
  return true;
}
