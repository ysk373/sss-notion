/**
 * シリーズ目次ページ（Notion の Slug と一致）へのリンクを記事から解決する。
 * scripts/create-series-hub-pages.mjs のシリーズ分けと揃えてある。
 */
import type { Post } from '../lib/interfaces'

/** 目次ページの URL 末尾 id（例: series-ros2-intro） */
export const HUB = {
  turtlebot3: 'series-turtlebot3-ros2',
  ros2Intro: 'series-ros2-intro',
  investing: 'series-investing-nisa',
  buildLink: 'series-build-link',
  astroNotion: 'series-astro-notion',
  signal: 'series-signal-processing',
  webDesign: 'series-web-design',
} as const

const BUILD_SLUGS = new Set([
  'compiler-and-linker-basics',
  'object-file-explained',
  'static-vs-dynamic-linking',
  'makefile-basics',
  'memory-map-explained',
])

const ASTRO_SLUGS = new Set([
  'astro-notion-blog-introduction',
  'how-to-start-astro-notion-blog-setup',
  'supported-blocks',
])

const SIGNAL_SLUGS = new Set([
  'digital-filter-design',
  'fft-basics-implementation',
  'ica-iva-noise-separation',
])

const WEB_SLUGS = new Set([
  'typography-tips',
  'minimal-design',
  'color-psychology',
])

const INVEST_TAGS = new Set(['投資', '新NISA', '株式投資'])

export type SeriesHubInfo = {
  hubSlug: string
  label: string
}

export function resolveSeriesHub(post: Post): SeriesHubInfo | null {
  if (post.Slug.startsWith('series-')) {
    return null
  }

  const title = post.Title

  if (title.includes('【TurtleBot3 ROS2環境構築')) {
    return {
      hubSlug: HUB.turtlebot3,
      label: 'TurtleBot3 × ROS2 環境構築シリーズ',
    }
  }

  if (title.includes('【ROS2入門')) {
    return { hubSlug: HUB.ros2Intro, label: 'ROS2入門シリーズ' }
  }

  const tagNames = post.Tags.map((t) => t.name)
  if (tagNames.some((n) => INVEST_TAGS.has(n))) {
    return {
      hubSlug: HUB.investing,
      label: '投資・新NISA 学習記事（ロードマップ）',
    }
  }

  if (BUILD_SLUGS.has(post.Slug)) {
    return {
      hubSlug: HUB.buildLink,
      label: 'コンパイル・リンク・ビルド（組み込み基礎）',
    }
  }

  if (ASTRO_SLUGS.has(post.Slug)) {
    return { hubSlug: HUB.astroNotion, label: 'Astro × Notion ブログ構築' }
  }

  if (SIGNAL_SLUGS.has(post.Slug)) {
    return { hubSlug: HUB.signal, label: '信号処理まとめ' }
  }

  if (WEB_SLUGS.has(post.Slug)) {
    return { hubSlug: HUB.webDesign, label: 'Webデザイン・UIメモ' }
  }

  return null
}

/** 投資系記事に共通で出す免責（タグで判定） */
export function isInvestmentPost(post: Post): boolean {
  return post.Tags.some((t) => INVEST_TAGS.has(t.name))
}
