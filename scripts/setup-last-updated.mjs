/**
 * Notion DB に LastUpdated（date）を追加し、未設定行は Date で初期化する（S-1）
 * 使い方: node scripts/setup-last-updated.mjs
 */
import { config } from 'dotenv'
import { Client } from '@notionhq/client'

config()

const databaseId = process.env.DATABASE_ID
const auth = process.env.NOTION_API_SECRET
if (!databaseId || !auth) {
  console.error('Missing DATABASE_ID or NOTION_API_SECRET in .env')
  process.exit(1)
}

const client = new Client({ auth })

async function ensureProperty() {
  const db = await client.databases.retrieve({ database_id: databaseId })
  if (db.properties?.LastUpdated) {
    console.log('LastUpdated property already exists')
    return
  }
  await client.databases.update({
    database_id: databaseId,
    properties: {
      LastUpdated: { date: {} },
    },
  })
  console.log('Added LastUpdated property to database')
}

async function backfill() {
  let cursor
  let updated = 0
  let skipped = 0
  do {
    const res = await client.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    })
    for (const page of res.results) {
      const p = page.properties
      if (p.LastUpdated?.date?.start) {
        skipped++
        continue
      }
      const dateStart = p.Date?.date?.start
      if (!dateStart) {
        skipped++
        continue
      }
      await client.pages.update({
        page_id: page.id,
        properties: {
          LastUpdated: { date: { start: dateStart } },
        },
      })
      updated++
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  console.log(`Backfill done: updated=${updated}, skipped=${skipped}`)
}

async function main() {
  await ensureProperty()
  await backfill()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
