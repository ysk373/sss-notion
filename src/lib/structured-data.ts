import type { Post } from './interfaces.ts'
import type { SeriesHubInfo } from '../constants/series-hubs.ts'
import { SITE_AUTHOR } from '../constants/site-author.ts'

export function getModifiedDate(post: Post): string {
  return post.LastUpdated?.trim() || post.Date
}

export function buildKeywords(post: Post): string[] {
  return post.Tags.map((t) => t.name).filter(Boolean)
}

export function buildBreadcrumbList(params: {
  siteOrigin: string
  postTitle: string
  postUrl: string
  seriesHub: SeriesHubInfo | null
  getPostPath: (slug: string) => string
}): Record<string, unknown> {
  const homeUrl = new URL(params.getPostPath('/'), params.siteOrigin).toString()
  const items: Record<string, unknown>[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'ホーム',
      item: homeUrl,
    },
  ]

  if (params.seriesHub) {
    const hubUrl = new URL(
      params.getPostPath(`/posts/${params.seriesHub.hubSlug}/`),
      params.siteOrigin
    ).toString()
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: params.seriesHub.label,
      item: hubUrl,
    })
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: params.postTitle,
      item: params.postUrl,
    })
  } else {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: params.postTitle,
      item: params.postUrl,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

export function buildBlogPostingSchema(params: {
  post: Post
  siteOrigin: string
  postUrl: string
  description: string
  ogImage?: string
  databaseTitle: string
  authorUrl: string
  seriesHub: SeriesHubInfo | null
  getPostPath: (slug: string) => string
}): Record<string, unknown> {
  const { post } = params
  const keywords = buildKeywords(post)
  const dateModified = getModifiedDate(post)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.Title,
    description: params.description,
    datePublished: post.Date,
    dateModified,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR.name,
      url: params.authorUrl,
      jobTitle: SITE_AUTHOR.jobTitle,
      description: SITE_AUTHOR.description,
    },
    publisher: {
      '@type': 'Organization',
      name: params.databaseTitle,
      url: new URL(params.getPostPath('/'), params.siteOrigin).toString(),
    },
    image: params.ogImage || undefined,
    url: params.postUrl,
    inLanguage: 'ja',
  }

  if (keywords.length > 0) {
    schema.keywords = keywords.join(', ')
  }

  if (params.seriesHub) {
    schema.isPartOf = {
      '@type': 'WebPage',
      '@id': new URL(
        params.getPostPath(`/posts/${params.seriesHub.hubSlug}/`),
        params.siteOrigin
      ).toString(),
      name: params.seriesHub.label,
    }
  }

  return schema
}
