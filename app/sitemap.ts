import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/data/contact';
import { SANCTUARIES } from '@/lib/data/sanctuaries';
import { JOURNAL_POSTS } from '@/lib/data/journal';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/list`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/adviser-call`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
  for (const s of SANCTUARIES) {
    routes.push({
      url: `${SITE_URL}/sanctuaries/${s.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }
  for (const p of JOURNAL_POSTS) {
    routes.push({
      url: `${SITE_URL}/blog/${p.id}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }
  return routes;
}
