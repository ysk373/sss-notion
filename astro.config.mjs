import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import { CUSTOM_DOMAIN, BASE_PATH } from './src/server-constants';
import CoverImageDownloader from './src/integrations/cover-image-downloader';
import CustomIconDownloader from './src/integrations/custom-icon-downloader';
import FeaturedImageDownloader from './src/integrations/featured-image-downloader';
import PublicNotionCopier from './src/integrations/public-notion-copier';

const normalizeBasePath = function (value) {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const normalizedBasePath = normalizeBasePath(BASE_PATH);

const getSite = function () {
  if (CUSTOM_DOMAIN) {
    return new URL(normalizedBasePath, `https://${CUSTOM_DOMAIN}`).toString();
  }

  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return new URL(
      normalizedBasePath,
      `https://${process.env.VERCEL_URL}`
    ).toString();
  }

  if (process.env.CF_PAGES) {
    if (process.env.CF_PAGES_BRANCH !== 'main') {
      return new URL(normalizedBasePath, process.env.CF_PAGES_URL).toString();
    }

    return new URL(
      normalizedBasePath,
      `https://${new URL(process.env.CF_PAGES_URL).host
        .split('.')
        .slice(1)
        .join('.')}`
    ).toString();
  }

  return new URL(normalizedBasePath, 'http://localhost:4321').toString();
};

// https://astro.build/config
export default defineConfig({
  site: getSite(),
  base: normalizedBasePath,
  integrations: [
    icon(),
    sitemap(),
    CoverImageDownloader(),
    CustomIconDownloader(),
    FeaturedImageDownloader(),
    PublicNotionCopier(),
  ],
});
