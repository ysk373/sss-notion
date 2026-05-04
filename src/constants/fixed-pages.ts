export const FIXED_PAGE_NAV_SLUGS = [
  'about',
  'contact',
  'privacy-policy',
  'disclaimer',
] as const

export type FixedPageNavSlug = (typeof FIXED_PAGE_NAV_SLUGS)[number]

export const FIXED_PAGE_NAV_LABELS = {
  about: '運営者情報',
  contact: 'お問い合わせ',
  'privacy-policy': 'プライバシーポリシー',
  disclaimer: '免責事項',
} as const satisfies Record<FixedPageNavSlug, string>
