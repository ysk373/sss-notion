/**
 * 公開記事の GEO 適合を Notion 本文から自動判定し、リライト優先度を付ける。
 * 使い方: node scripts/geo-audit.mjs [--limit N] [--slug xxx]
 * 出力: tmp/geo-audit.json（スコア降順）
 */
import { config } from 'dotenv'
import { Client } from '@notionhq/client'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const databaseId = process.env.DATABASE_ID
const auth = process.env.NOTION_API_SECRET
if (!databaseId || !auth) {
  console.error('Missing DATABASE_ID or NOTION_API_SECRET in .env')
  process.exit(1)
}

const client = new Client({ auth })

const FIXED_SLUGS = new Set([
  'about',
  'contact',
  'privacy-policy',
  'disclaimer',
])

const INVEST_TAGS = new Set(['投資', '新NISA', '株式投資'])
const QUERY_H2 = /[？?]|とは|手順|方法|やり方|違い|比較|上限|インストール/
const FRESHNESS = /20\d{2}年\d{1,2}月/

function parseArgs() {
  const args = process.argv.slice(2)
  let limit = 0
  let slugFilter = ''
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--limit' && args[i + 1]) {
      limit = parseInt(args[++i], 10)
    } else if (a.startsWith('--limit=')) {
      limit = parseInt(a.split('=')[1], 10)
    } else if (a === '--slug' && args[i + 1]) {
      slugFilter = args[++i]
    } else if (/^\d+$/.test(a)) {
      limit = parseInt(a, 10)
    }
  }
  return { limit, slugFilter }
}

function isInfoTag(tags) {
  return tags.some((t) => t === 'Info')
}

function resolveSeriesHub(slug, title, tags) {
  if (slug.startsWith('series-')) return ''
  if (title.includes('【TurtleBot3 ROS2環境構築')) return 'series-turtlebot3-ros2'
  if (title.includes('【ROS2入門')) return 'series-ros2-intro'
  if (tags.some((t) => INVEST_TAGS.has(t))) return 'series-investing-nisa'
  return ''
}

async function fetchAllBlocks(blockId) {
  const blocks = []
  let cursor
  do {
    const res = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    })
    for (const b of res.results) {
      blocks.push(b)
      if (b.has_children && b.type !== 'child_page' && b.type !== 'child_database') {
        const nested = await fetchAllBlocks(b.id)
        blocks.push(...nested)
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return blocks
}

function richPlain(richText = []) {
  return richText.map((t) => t.plain_text || '').join('')
}

function collectBodySignals(blocks) {
  const h2Texts = []
  const introParagraphs = []
  let externalLinks = 0
  let numberedLists = 0
  let paragraphCount = 0

  for (const b of blocks) {
    const type = b.type
    if (type === 'heading_2' && b.heading_2) {
      h2Texts.push(richPlain(b.heading_2.rich_text))
    }
    if (type === 'heading_1' && b.heading_1) {
      h2Texts.push(richPlain(b.heading_1.rich_text))
    }
    const rich =
      b.paragraph?.rich_text ||
      b.bulleted_list_item?.rich_text ||
      b.numbered_list_item?.rich_text ||
      b.quote?.rich_text ||
      b.callout?.rich_text ||
      null
    if (rich) {
      if (type === 'paragraph') paragraphCount++
      const text = richPlain(rich)
      if (type === 'paragraph' && introParagraphs.length < 3 && text.trim()) {
        introParagraphs.push(text)
      }
      for (const rt of rich) {
        const href = rt.href || rt.text?.link?.url
        if (href && /^https?:\/\//i.test(href)) {
          externalLinks++
        }
      }
      if (/https?:\/\//i.test(text)) {
        externalLinks++
      }
      if (/^\d+\.\s/.test(text)) {
        numberedLists++
      }
    }
    if (type === 'numbered_list_item') {
      numberedLists++
    }
    if (
      type === 'heading_3' &&
      b.heading_3 &&
      (/^Step\s*\d+/i.test(richPlain(b.heading_3.rich_text)) ||
        /^\d+[-.)]\s/.test(richPlain(b.heading_3.rich_text)) ||
        /^\d+-\d+\./.test(richPlain(b.heading_3.rich_text)))
    ) {
      numberedLists++
    }
  }

  const heading3Count = blocks.filter((b) => b.type === 'heading_3').length

  return {
    h2Texts,
    introChars: introParagraphs.join('').length,
    introText: introParagraphs.join('\n'),
    externalLinks,
    numberedLists,
    heading3Count,
    paragraphCount,
    bodySample: blocks
      .slice(0, 40)
      .map((b) => {
        if (b.type === 'paragraph' && b.paragraph) {
          return richPlain(b.paragraph.rich_text)
        }
        if (b.type === 'heading_2' && b.heading_2) {
          return richPlain(b.heading_2.rich_text)
        }
        return ''
      })
      .join(''),
  }
}

function auditPost(meta, body) {
  const issues = []
  const { excerpt, tags, seriesHub } = meta

  if (!excerpt.trim()) {
    issues.push({ id: 'missing_excerpt', weight: 3 })
  } else if (excerpt.length < 40) {
    issues.push({ id: 'excerpt_short', weight: 2 })
  }

  if (body.h2Texts.length === 0) {
    issues.push({ id: 'no_h2', weight: 3 })
  } else if (!body.h2Texts.some((t) => QUERY_H2.test(t))) {
    issues.push({ id: 'h2_not_query_like', weight: 2 })
  }

  if (body.introChars < 120) {
    issues.push({ id: 'intro_thin', weight: 3 })
  }

  if (body.externalLinks === 0 && body.paragraphCount >= 5) {
    issues.push({ id: 'no_external_link', weight: 2 })
  }

  const isHowTo = tags.includes('How-to') || /手順|インストール|構築|設定/.test(meta.title)
  const hasProcedureStructure =
    body.numberedLists > 0 || (isHowTo && body.heading3Count >= 4)
  if (isHowTo && !hasProcedureStructure) {
    issues.push({ id: 'howto_no_numbered_list', weight: 2 })
  }

  const freshnessText = `${excerpt}\n${body.introText}\n${body.bodySample.slice(0, 400)}`
  if (!FRESHNESS.test(freshnessText)) {
    issues.push({ id: 'no_freshness_marker', weight: 1 })
  }

  if (seriesHub && !meta.title.includes('シリーズ') && !meta.slug.startsWith('series-')) {
    // シリーズ記事はサイト側 SeriesHubNotice が付くため軽微
  }

  const score = issues.reduce((s, i) => s + i.weight, 0)
  return {
    pageId: meta.pageId,
    slug: meta.slug,
    title: meta.title,
    date: meta.date,
    lastUpdated: meta.lastUpdated,
    tags: meta.tags,
    seriesHub: seriesHub || null,
    excerptLen: excerpt.length,
    h2Count: body.h2Texts.length,
    score,
    issues: issues.map((i) => i.id),
  }
}

async function queryPosts() {
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
      const tags = (p.Tags?.multi_select || []).map((t) => t.name)
      const excerpt = (p.Excerpt?.rich_text || [])
        .map((t) => t.plain_text)
        .join('')
      return {
        pageId: page.id,
        slug,
        title,
        tags,
        date: p.Date?.date?.start ?? '',
        lastUpdated: p.LastUpdated?.date?.start ?? '',
        excerpt,
        seriesHub: resolveSeriesHub(slug, title, tags),
      }
    })
    .filter((r) => r.slug && r.title)
    .filter((r) => !FIXED_SLUGS.has(r.slug) && !isInfoTag(r.tags))
    .filter((r) => !r.slug.startsWith('series-'))
}

async function main() {
  const { limit, slugFilter } = parseArgs()
  let posts = await queryPosts()
  if (slugFilter) {
    posts = posts.filter((p) => p.slug === slugFilter)
  }
  if (limit > 0) {
    posts = posts.slice(0, limit)
  }

  console.log(`Auditing ${posts.length} posts...`)
  const reports = []

  for (let i = 0; i < posts.length; i++) {
    const meta = posts[i]
    process.stdout.write(`  [${i + 1}/${posts.length}] ${meta.slug}\r`)
    const blocks = await fetchAllBlocks(meta.pageId)
    const body = collectBodySignals(blocks)
    reports.push(auditPost(meta, body))
  }

  reports.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))

  const tmpDir = join(__dirname, '../tmp')
  mkdirSync(tmpDir, { recursive: true })
  const outPath = join(tmpDir, 'geo-audit.json')
  const payload = {
    generatedAt: new Date().toISOString(),
    postCount: reports.length,
    needsRewrite: reports.filter((r) => r.score > 0),
    posts: reports,
  }
  writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')

  const top = reports.filter((r) => r.score > 0).slice(0, 10)
  console.log(`\nWrote ${outPath}`)
  console.log(`Needs rewrite: ${payload.needsRewrite.length} / ${reports.length}`)
  if (top.length) {
    console.log('Top priority:')
    for (const r of top) {
      console.log(`  ${r.score}\t${r.slug}\t${r.issues.join(', ')}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
