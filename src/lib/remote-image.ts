import { getImage } from 'astro:assets';

type Optimised = Awaited<ReturnType<typeof getImage>>;

/**
 * Build-time resolution of remote images, memoised per build.
 *
 * `inferSize` fetches the image to read its intrinsic dimensions, which makes the
 * build depend on a third-party host. Two problems follow, both handled here:
 *
 *   1. An unreachable host must not fail the build. A failure resolves to
 *      `undefined` so the caller can fall back to the original URL.
 *   2. The same URL appears on many pages (a card on the listing, the home page,
 *      related posts, the post itself). Without memoisation an unreachable host
 *      costs a full connection timeout *per render* — minutes across a build.
 *      Successes are cached too, saving repeat fetches.
 */
// Successes are keyed by URL *and* size variant, since each variant is a distinct
// image. Failures are keyed by URL alone: an unreachable host is unreachable at
// every size, so one timeout is enough to rule out all of them.
const cache = new Map<string, Optimised | undefined>();
const unreachable = new Set<string>();

export async function resolveRemoteImage(
  src: string,
  options: { widths: number[]; sizes: string },
): Promise<Optimised | undefined> {
  if (unreachable.has(src)) return undefined;

  const key = `${src}|${options.widths.join(',')}|${options.sizes}`;
  if (cache.has(key)) return cache.get(key);

  let result: Optimised | undefined;
  try {
    result = await getImage({
      src,
      inferSize: true,
      widths: options.widths,
      sizes: options.sizes,
      format: 'webp',
    });
  } catch (error) {
    console.warn(
      `[image] Could not fetch ${src} at build time — embedding it unoptimised, ` +
        `loaded from its original host. ` +
        `Cause: ${error instanceof Error ? error.message : String(error)}`,
    );
    unreachable.add(src);
    result = undefined;
  }

  cache.set(key, result);
  return result;
}
