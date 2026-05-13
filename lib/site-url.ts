/**
 * Public site origin for absolute links in emails (video release, etc.).
 *
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. `https://www.cleantothemacks.com`).
 * If unset on Vercel, uses `https://${VERCEL_URL}` so links are not `localhost`.
 */
export function getPublicSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
