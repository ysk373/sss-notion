/**
 * public/llms.txt を生成する（O-1）
 * 使い方: node scripts/generate-llms-txt.mjs
 */
import { config } from 'dotenv'
import { Client } from '@notionhq/client'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://sssstudy.com').replace(
  /\/$/,
  ''
)

const databaseId = process.env.DATABASE_ID
const auth = process.env.NOTION_API_SECRET
if (!databaseId || !auth) {
  console.error('Missing DATABASE_ID or NOTION_API_SECRET in .env')
  process.exit(1)
}

const client = new Client({ auth })

const SERIES_HUBS = [
  { slug: 'series-turtlebot3-ros2', label: 'TurtleBot3 × ROS2 環境構築' },
  { slug: 'series-ros2-intro', label: 'ROS2 入門' },
  { slug: 'series-investing-nisa', label: '投資・新NISA 学習ロードマップ' },
  { slug: 'series-build-link', label: 'コンパイル・リンク・ビルド' },
  { slug: 'series-astro-notion', label: 'Astro × Notion ブログ構築' },
  { slug: 'series-signal-processing', label: '信号処理' },
  { slug: 'series-web-design', label: 'Web デザイン・UI' },
]

const FIXED = [
  { slug: 'about', label: '運営者情報' },
  { slug: 'contact', label: 'お問い合わせ' },
  { slug: 'privacy-policy', label: 'プライバシーポリシー' },
  { slug: 'disclaimer', label: '免責事項' },
]

async function fetchPublishedPosts() {
  const params = {
    database_id: databaseId,
    filter: {
      and: [
        { property: 'Published', checkbox: { equals: true } },
        {
          property: 'Date',
          date: { on_or_before: new Date().toISOString() },
        },
      ],
    },
    sorts: [{ property: 'Date', direction: 'descending' }],
  }
  let results = []
  let res = await client.databases.query(params)
  results = results.concat(res.results)
  while (res.has_more) {
    params.start_cursor = res.next_cursor
    res = await client.databases.query(params)
    results = results.concat(res.results)
  }
  return results
    .map((page) => {
      const p = page.properties
      const slug = p.Slug?.rich_text?.[0]?.plain_text ?? ''
      const title = p.Page?.title?.[0]?.plain_text ?? ''
      const excerpt = (p.Excerpt?.rich_text || [])
        .map((t) => t.plain_text)
        .join('')
      const tags = (p.Tags?.multi_select || []).map((t) => t.name)
      return { slug, title, excerpt, tags }
    })
    .filter((r) => r.slug && r.title)
}

function mainContent(posts, tagSet) {
  const lines = [
    '# 30代エンジニアの備忘録 (SSS Study)',
    '',
    `> ${siteUrl}/`,
    '',
    '組み込み・ROS2・信号処理・投資メモの個人技術ブログ。記事本文は Notion が正本。',
    '',
    '## 固定ページ',
    '',
    ...FIXED.map(
      (f) => `- [${f.label}](${siteUrl}/posts/${f.slug}/)`
    ),
    '',
    '## シリーズ目次',
    '',
    ...SERIES_HUBS.map(
      (s) => `- [${s.label}](${siteUrl}/posts/${s.slug}/)`
    ),
    '',
    '## タグ',
    '',
    ...[...tagSet].sort().map((t) => `- ${t}`),
    '',
    '## 公開記事（新しい順）',
    '',
  ]

  for (const p of posts) {
    if (FIXED.some((f) => f.slug === p.slug)) continue
    if (p.slug.startsWith('series-')) continue
    if (p.tags.includes('Info')) continue
    const url = `${siteUrl}/posts/${p.slug}/`
    const summary = p.excerpt ? `: ${p.excerpt}` : ''
    lines.push(`- [${p.title}](${url})${summary}`)
  }

  lines.push('', '## フィード', '', `- RSS: ${siteUrl}/feed`, '')
  return lines.join('\n')
}

async function main() {
  const posts = await fetchPublishedPosts()
  const tagSet = new Set()
  for (const p of posts) {
    for (const t of p.tags) tagSet.add(t)
  }
  const body = mainContent(posts, tagSet)
  const out = join(__dirname, '../public/llms.txt')
  writeFileSync(out, body, 'utf8')
  console.log(`Wrote ${out} (${posts.length} posts scanned)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
