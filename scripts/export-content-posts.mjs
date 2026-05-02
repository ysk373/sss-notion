/**
 * 一度きりの棚卸し用: 公開記事の Title / Slug / Tags / Date を JSON で出す
 * 使い方: node scripts/export-content-posts.mjs
 */
import { config } from 'dotenv'
import { Client } from '@notionhq/client'
import { writeFileSync } from 'node:fs'
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

const FIXED_SLUGS = new Set(['about', 'contact', 'privacy-policy', 'disclaimer'])

function isInfoTag(tags) {
  return tags.some((t) => t === 'Info')
}

async function main() {
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

  const rows = results
    .map((page) => {
      const p = page.properties
      const slug = p.Slug?.rich_text?.[0]?.plain_text ?? ''
      const title = p.Page?.title?.[0]?.plain_text ?? ''
      const tags = (p.Tags?.multi_select || []).map((t) => t.name)
      const date = p.Date?.date?.start ?? ''
      return { pageId: page.id, title, slug, tags, date }
    })
    .filter((r) => r.slug && r.title)
    .filter(
      (r) => !FIXED_SLUGS.has(r.slug) && !isInfoTag(r.tags)
    )

  const out = join(__dirname, '../tmp/content-posts.json')
  writeFileSync(out, JSON.stringify(rows, null, 2), 'utf8')
  console.log(`Wrote ${rows.length} posts to ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
