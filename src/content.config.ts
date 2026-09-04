import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  // `image()` resolves the frontmatter path relative to the markdown file, which is
  // why the CMS writes `../../assets/images/uploads/...` (see public/admin/config.yml).
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      author: z.string(),
      // Local upload (optimised via the asset pipeline) or a remote URL.
      // The union keeps the runtime type honest — image() passes URLs through
      // as plain strings rather than resolving them to ImageMetadata.
      featured_image: z.union([image(), z.string().url()]),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      // Optional Google Maps "Share -> Embed a map" snippet. Stored verbatim; only
      // the src is used at render time (see src/lib/maps.ts).
      map_embed: z.string().optional(),
    }),
});

export const collections = { blog };
