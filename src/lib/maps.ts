/**
 * Map embed handling.
 *
 * The CMS field takes whatever Google hands you from "Share → Embed a map", which is a
 * full `<iframe …>` snippet. We deliberately do NOT render that markup. Instead we pull
 * out the `src` and build our own iframe, for two reasons:
 *
 *   1. Safety — no author-supplied HTML is ever injected into the page.
 *   2. Layout — Google's snippet hardcodes `width="600" height="450"`, which would
 *      defeat the full-width responsive frame the site wants.
 */

/** Minimal entity decoding: a pasted `src` carries `&amp;` between query parameters. */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Pull a usable map URL out of the CMS field.
 *
 * Accepts a full `<iframe>` snippet or a bare URL. Returns `undefined` for anything
 * that is not an https URL, so a mistyped or malicious value renders nothing at all
 * rather than half a map or an unexpected embed.
 */
export function extractMapSrc(embed: string | undefined | null): string | undefined {
  if (!embed) return undefined;

  const trimmed = embed.trim();
  if (!trimmed) return undefined;

  const iframeSrc = trimmed.match(/<iframe[^>]*\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  const candidate = decodeEntities(iframeSrc ?? trimmed);

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }

  // https only — an http embed would be blocked as mixed content anyway.
  if (url.protocol !== 'https:') return undefined;

  return url.href;
}
