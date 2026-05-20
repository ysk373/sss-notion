/**
 * レビュー結果を rewrites にマージしてから一括適用
 *   node scripts/geo-apply-reviewed.mjs
 * tmp/reviews/*.json: { slug, blockUpdates: [{notionId, kind, text}], excerpt? }
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rewritesDir = join(__dirname, '../tmp/rewrites')
const reviewsDir = join(__dirname, '../tmp/reviews')

function mergeReview(slug, review) {
  const rewritePath = join(rewritesDir, `${slug}.json`)
  if (!existsSync(rewritePath)) {
    console.warn(`Skip review merge, no rewrite: ${slug}`)
    return
  }
  const rewrite = JSON.parse(readFileSync(rewritePath, 'utf8'))
  if (review.excerpt) rewrite.excerpt = review.excerpt
  if (review.blockUpdates?.length) {
    const map = new Map(review.blockUpdates.map((u) => [u.notionId, u]))
    rewrite.blocks = rewrite.blocks.map((b) => {
      const u = map.get(b.notionId)
      if (!u) return b
      return { ...b, ...u }
    })
    rewrite.blockUpdates = review.blockUpdates
  }
  writeFileSync(rewritePath, JSON.stringify(rewrite, null, 2), 'utf8')
  console.log(`Merged review into ${slug}`)
}

async function main() {
  if (!existsSync(reviewsDir)) {
    console.log('No reviews dir, running apply-all only')
  } else {
    for (const f of readdirSync(reviewsDir).filter((x) => x.endsWith('.json'))) {
      const data = JSON.parse(
        readFileSync(join(reviewsDir, f), 'utf8')
      )
      const items = Array.isArray(data) ? data : data.articles || [data]
      for (const item of items) {
        if (item.slug) await mergeReview(item.slug, item)
      }
    }
  }
  await new Promise((resolve, reject) => {
    const p = spawn('node', ['scripts/notion-article-io.mjs', 'apply-all'], {
      cwd: join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
    })
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
