/**
 * シリーズ目次ページを Notion DB に追加する（同じ Slug があればスキップ）
 * 使い方: node scripts/create-series-hub-pages.mjs
 */
import { config } from 'dotenv'
import { Client } from '@notionhq/client'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const databaseId = process.env.DATABASE_ID
const auth = process.env.NOTION_API_SECRET
if (!databaseId || !auth) {
  console.error('Missing DATABASE_ID or NOTION_API_SECRET')
  process.exit(1)
}

const client = new Client({ auth })

/** 本番サイトの記事URL（GitHub Pages のカスタムドメイン） */
const PUBLIC_SITE = 'https://sssstudy.com'

function postUrl(slug) {
  return `${PUBLIC_SITE}/posts/${slug}/`
}

/** 円付き数字の並び（ROS2入門①〜⑪） */
const CIRCLE_NUM = '①②③④⑤⑥⑦⑧⑨⑩⑪'

function ros2IntroOrder(title) {
  const m = title.match(/【ROS2入門(.)】/)
  if (!m) return 99
  const i = CIRCLE_NUM.indexOf(m[1])
  return i === -1 ? 99 : i
}

const TURTLE_SLUG_ORDER = [
  'turtlebot3-ros2-overview',
  'turtlebot3-ros2-host-pc-setup',
  'turtlebot3-ros2-raspberry-pi-setup',
  'turtlebot3-ros2-network-setup',
  'turtlebot3-ros2-setup-04-network-ssh',
]

const INVEST_SLUG_ORDER = [
  'investment-study',
  'why-engineer-started-nisa',
  'emergency-fund-before-nisa',
  'household-budget-50k-to-investment',
  'nisa-monthly-amount-from-budget',
  'all-country-vs-sp500-nisa',
  'dca-drawdown-python-nisa',
]

const BUILD_SLUG_ORDER = [
  'compiler-and-linker-basics',
  'object-file-explained',
  'static-vs-dynamic-linking',
  'makefile-basics',
  'memory-map-explained',
]

const ASTRO_SLUG_ORDER = [
  'astro-notion-blog-introduction',
  'how-to-start-astro-notion-blog-setup',
  'supported-blocks',
]

const SIGNAL_SLUG_ORDER = [
  'digital-filter-design',
  'fft-basics-implementation',
  'ica-iva-noise-separation',
]

const WEB_SLUG_ORDER = [
  'typography-tips',
  'minimal-design',
  'color-psychology',
]

function sortBySlugOrder(posts, order) {
  const rank = new Map(order.map((s, i) => [s, i]))
  return [...posts].sort((a, b) => {
    const ra = rank.has(a.slug) ? rank.get(a.slug) : 999
    const rb = rank.has(b.slug) ? rank.get(b.slug) : 999
    return ra - rb
  })
}

function richTextParagraph(text) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  }
}

function richTextHeading2(text) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  }
}

function bulletWithLink(title, url) {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        {
          type: 'text',
          text: { content: title, link: { url } },
        },
      ],
    },
  }
}

async function findPageBySlug(slug) {
  const res = await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Slug',
      rich_text: { equals: slug },
    },
    page_size: 1,
  })
  return res.results[0] ?? null
}

async function createHubPage({
  hubSlug,
  hubTitle,
  excerpt,
  tagNames,
  introLines,
  posts,
}) {
  const existing = await findPageBySlug(hubSlug)
  if (existing) {
    console.log(`[skip] 既にある: ${hubSlug}`)
    return
  }

  const today = new Date().toISOString().slice(0, 10)

  const children = [
    ...introLines.map((line) => richTextParagraph(line)),
    richTextHeading2('記事一覧'),
    ...posts.map((p) => bulletWithLink(p.title, postUrl(p.slug))),
    richTextParagraph(
      '※ URL はサイト公開時のものです。ローカル確認時はポート番号が異なります。'
    ),
  ]

  await client.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Page: {
        title: [{ type: 'text', text: { content: hubTitle } }],
      },
      Slug: {
        rich_text: [{ type: 'text', text: { content: hubSlug } }],
      },
      Excerpt: {
        rich_text: [{ type: 'text', text: { content: excerpt } }],
      },
      Published: { checkbox: true },
      Date: {
        date: { start: today },
      },
      Tags: {
        multi_select: tagNames.map((name) => ({ name })),
      },
    },
    children,
  })

  console.log(`[ok] 作成: ${hubSlug}`)
}

async function main() {
  const jsonPath = join(__dirname, '../tmp/content-posts.json')
  const raw = readFileSync(jsonPath, 'utf8')
  const allPosts = JSON.parse(raw)

  const turtlePosts = allPosts
    .filter((p) => p.title.includes('【TurtleBot3 ROS2環境構築'))
    .sort(
      (a, b) =>
        TURTLE_SLUG_ORDER.indexOf(a.slug) - TURTLE_SLUG_ORDER.indexOf(b.slug)
    )

  const ros2Posts = allPosts
    .filter((p) => p.title.includes('【ROS2入門'))
    .sort((a, b) => ros2IntroOrder(a.title) - ros2IntroOrder(b.title))

  const investPosts = sortBySlugOrder(
    allPosts.filter(
      (p) =>
        p.tags.some((t) =>
          ['投資', '新NISA', '株式投資'].includes(t)
        )
    ),
    INVEST_SLUG_ORDER
  )

  const buildPosts = sortBySlugOrder(
    allPosts.filter((p) => BUILD_SLUG_ORDER.includes(p.slug)),
    BUILD_SLUG_ORDER
  )

  const astroPosts = sortBySlugOrder(
    allPosts.filter((p) => ASTRO_SLUG_ORDER.includes(p.slug)),
    ASTRO_SLUG_ORDER
  )

  const signalPosts = sortBySlugOrder(
    allPosts.filter((p) => SIGNAL_SLUG_ORDER.includes(p.slug)),
    SIGNAL_SLUG_ORDER
  )

  const webPosts = sortBySlugOrder(
    allPosts.filter((p) => WEB_SLUG_ORDER.includes(p.slug)),
    WEB_SLUG_ORDER
  )

  await createHubPage({
    hubSlug: 'series-turtlebot3-ros2',
    hubTitle: '【シリーズ目次】TurtleBot3 × ROS2 環境構築',
    excerpt:
      'TurtleBot3 と ROS2 Humble を使った環境構築記事の読む順です。④は Wi-Fi 版と SSH 版の2本があります。',
    tagNames: ['How-to', '技術'],
    introLines: [
      'このページは「TurtleBot3 × ROS2（Humble）環境構築」関連記事の目次です。',
      '前提: Ubuntu 22.04、ROS2 Humble を想定しています。',
    ],
    posts: turtlePosts,
  })

  await createHubPage({
    hubSlug: 'series-ros2-intro',
    hubTitle: '【シリーズ目次】ROS2入門（①〜⑪）',
    excerpt:
      'ROS2 の基本概念から Nav2 までの連載の読む順です。',
    tagNames: ['How-to', '技術'],
    introLines: [
      'このページは「ROS2入門」シリーズの目次です。',
      '初めての方は ① から順に読むのがおすすめです。',
    ],
    posts: ros2Posts,
  })

  await createHubPage({
    hubSlug: 'series-investing-nisa',
    hubTitle: '【シリーズ目次】投資・新NISA 学習記事ロードマップ',
    excerpt:
      '家計と NISA の考え方を整理した記事への導線です（個人の学習記録であり特定商品の推奨ではありません）。',
    tagNames: ['How-to', '投資'],
    introLines: [
      'このページは投資・新NISA 関連記事の読む順の例です。',
      '記事はすべて筆者の学習記録です。投資判断はご自身の責任でお願いします。',
    ],
    posts: investPosts,
  })

  await createHubPage({
    hubSlug: 'series-build-link',
    hubTitle: '【シリーズ目次】コンパイル・リンク・ビルド（組み込み基礎）',
    excerpt:
      'コンパイラから Makefile、メモリマップまでの連載の読む順です。',
    tagNames: ['How-to', '技術'],
    introLines: [
      'このページは、コンパイル〜リンク〜ビルド〜メモリ配置までをつなぐ目次です。',
      '同じ日付の記事でも、この順で読むと流れが滑らかです。',
    ],
    posts: buildPosts,
  })

  await createHubPage({
    hubSlug: 'series-astro-notion',
    hubTitle: '【シリーズ目次】Astro × Notion ブログ構築',
    excerpt: 'astro-notion-blog を使ったブログ立ち上げ関連記事のまとめです。',
    tagNames: ['How-to', 'Web'],
    introLines: [
      'このページは Notion + Astro でブログを公開する手順まわりの記事への案内です。',
    ],
    posts: astroPosts,
  })

  await createHubPage({
    hubSlug: 'series-signal-processing',
    hubTitle: '【シリーズ目次】信号処理まとめ',
    excerpt: 'FFT・フィルタ・音源分離など信号処理関連の記事一覧です。',
    tagNames: ['How-to', '技術', '信号処理'],
    introLines: [
      'このページは信号処理タグの記事への目次です。',
    ],
    posts: signalPosts,
  })

  await createHubPage({
    hubSlug: 'series-web-design',
    hubTitle: '【シリーズ目次】Webデザイン・UIメモ',
    excerpt: 'タイポグラフィ、ミニマルデザイン、色彩心理など Web 周りの記事です。',
    tagNames: ['How-to', '技術', 'Web'],
    introLines: [
      'このページは Web / UI 関連の記事への目次です。',
    ],
    posts: webPosts,
  })

  console.log('完了')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
