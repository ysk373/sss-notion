import { APIResponseError } from '@notionhq/client'

/** Notion 連携まわりのビルド失敗時に、よくある原因と対処を出す */
export function logNotionUnauthorizedHint(error: unknown): void {
  if (error instanceof APIResponseError && error.code === 'unauthorized') {
    console.error(
      '[Notion] API token が無効です（401 unauthorized）。次を確認してください。\n' +
        '  1. https://www.notion.so/my-integrations で対象インテグレーションを開き、Internal Integration Secret をコピーして .env の NOTION_API_SECRET を更新する（再発行すると旧シークレットはすぐ使えません）。\n' +
        '  2. 記事データベースのページで「⋯」→「コネクト」または「Connections」から、そのインテグレーションを追加しているか。\n' +
        '  3. .env を保存したうえで、ターミナルを開き直してから再度 npm run build する。'
    )
  }
}

export async function withNotionUnauthorizedHint<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    logNotionUnauthorizedHint(e)
    throw e
  }
}
