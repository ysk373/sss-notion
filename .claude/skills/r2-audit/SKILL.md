---
name: r2-audit
description: Cloudflare R2バケット内の孤立ファイルを検出するスキル。Notionの記事データベースと照合して、削除済み記事や差し替え済み画像の残骸を特定する。「R2の掃除」「孤立ファイルを確認」「R2 audit」と言ったときに使用する。
---

# R2 Audit スキル

Cloudflare R2 (`sss-blog-images`) に存在するファイルと、Notion データベースの記事スラッグを照合して孤立ファイルを検出する。

## 手順

### Step 1: Notion の記事スラッグ一覧を取得

`notion-search` または `notion-fetch` で SSS Blog データベース（ID: `2d82403f-bc5c-819f-a7f6-f1caee97d49f`）から全記事の Slug プロパティを取得する。

### Step 2: R2 のファイル一覧を取得

```bash
npx wrangler r2 object list sss-blog-images --prefix articles/ 2>/dev/null
npx wrangler r2 object list sss-blog-images --prefix thumbnails/ 2>/dev/null
```

### Step 3: 照合して孤立ファイルを特定

- `articles/{スラッグ}/` 配下のファイルで、対応するスラッグが Notion に存在しないものを孤立ファイルとして報告
- `thumbnails/` 配下のファイルで、対応する記事が存在しないものも報告

### Step 4: レポートを出力

以下の形式でまとめる：

```
## R2 Audit レポート

### 孤立ファイル（削除候補）
- articles/old-slug/image.png  ← スラッグ "old-slug" が Notion に存在しない
- thumbnails/removed-article.png  ← 対応記事なし

### 正常ファイル数
- articles/: XX ファイル
- thumbnails/: XX ファイル

### 推奨アクション
削除する場合: npm run r2:delete -- <キー>
```

## 注意事項

- 削除は実行しない。あくまで報告のみ。
- 実際の削除はユーザーが `npm run r2:delete` で行う。
- Published=false の下書き記事のスラッグも有効として扱う（削除しない）。
