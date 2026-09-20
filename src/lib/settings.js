import { storyblokApi } from '@storyblok/astro/client';

// Site-wide fallbacks, edited in the `settings` story in Storyblok.
// Fetched once per build (or per server start) and reused.
let cached;

export async function getSettings() {
  if (cached) return cached;

  const isDraft =
    import.meta.env.DEV || import.meta.env.STORYBLOK_IS_PREVIEW === 'yes';

  try {
    const { data } = await storyblokApi.get('cdn/stories/settings', {
      version: isDraft ? 'draft' : 'published',
    });
    cached = data.story.content ?? {};
  } catch {
    // No settings story yet — the site still works, just without fallbacks.
    cached = {};
  }

  return cached;
}
