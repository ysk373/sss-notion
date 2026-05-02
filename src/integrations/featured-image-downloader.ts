import type { AstroIntegration } from 'astro'
import { getAllPosts, downloadFile } from '../lib/notion/client'

/**
 * 公開記事のサムネイルを public/notion/ に保存する。
 * 本番ビルドは astro:build:start のみだったため、npm run dev では一覧の img が
 * Notion の期限付きURLを直参照していて表示できないケースがあった。
 */
async function downloadAllFeaturedImages(): Promise<void> {
  const posts = await getAllPosts()

  await Promise.all(
    posts.map((post) => {
      if (!post.FeaturedImage || !post.FeaturedImage.Url) {
        return Promise.resolve()
      }

      let url!: URL
      try {
        url = new URL(post.FeaturedImage.Url)
      } catch {
        console.log('Invalid FeaturedImage URL: ', post.FeaturedImage?.Url)
        return Promise.resolve()
      }

      return downloadFile(url)
    })
  )
}

export default (): AstroIntegration => ({
  name: 'featured-image-downloader',
  hooks: {
    'astro:build:start': async () => {
      await downloadAllFeaturedImages()
    },
    /** dev サーバー起動「前」に実行され、localhost でもサムネを同一オリジン配信できる */
    'astro:server:setup': async ({ logger }) => {
      logger.info('Fetching featured images for local dev...')
      await downloadAllFeaturedImages()
      logger.info('Featured images downloaded.')
    },
  },
})
