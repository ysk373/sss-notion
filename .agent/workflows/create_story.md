---
description: テンプレートから新しい短編小説を作成する
---

# MCP経由で短編小説を作成

Notion MCPを使用して、AIが直接Notionに短編小説を作成します。
ブログ記事と同じデータベースを使用し、`stories`タグで分類します。

## 手順

### 1. ユーザーに小説情報を確認

以下の情報をユーザーに尋ねてください：

- **タイトル**: 小説のタイトル
- **スラッグ**: URL用のスラッグ（例: `digital-dream`）
- **ジャンル**: SF, ミステリー, ファンタジー, ホラー など
- **要約**: 小説の概要（1-2文）
- **本文**: 小説の内容

### 2. ページを作成

// turbo
MCPツール `API-post-page` を使用：

```json
{
  "parent": { "database_id": "2d82403f-bc5c-819f-a7f6-f1caee97d49f" },
  "properties": {
    "title": [{ "text": { "content": "{タイトル}" } }]
  }
}
```

### 3. プロパティを設定

// turbo
MCPツール `API-patch-page` を使用：

```json
{
  "page_id": "{作成されたページID}",
  "properties": {
    "Slug": { "rich_text": [{ "text": { "content": "{スラッグ}" } }] },
    "Date": { "date": { "start": "{YYYY-MM-DD}" } },
    "Tags": {
      "multi_select": [{ "name": "stories" }, { "name": "{ジャンル}" }]
    },
    "Excerpt": { "rich_text": [{ "text": { "content": "{要約}" } }] },
    "Published": { "checkbox": true }
  }
}
```

**重要**: `stories`タグを必ず含めること（短編小説一覧で表示するため）

### 4. 本文を追加

// turbo
MCPツール `API-patch-block-children` を使用：

```json
{
  "block_id": "{ページID}",
  "children": [
    {
      "object": "block",
      "type": "heading_1",
      "heading_1": {
        "rich_text": [
          { "type": "text", "text": { "content": "第1章：{章タイトル}" } }
        ]
      }
    },
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "{本文}" } }]
      }
    },
    { "object": "block", "type": "divider", "divider": {} },
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "--- 完 ---" } }]
      }
    }
  ]
}
```

### 5. 確認

- 開発サーバー再起動が必要な場合: `docker-compose down && docker-compose up --build`
- 記事URL: `http://localhost:4321/posts/{スラッグ}`
- 短編小説一覧: `http://localhost:4321/posts/tag/stories`

## 小説向けブロックタイプ

- `heading_1`, `heading_2`: 章・節見出し
- `paragraph`: 本文
- `divider`: 区切り線（シーン転換）
- `quote`: 引用・強調

## データベースID

SSS Blog: `2d82403f-bc5c-819f-a7f6-f1caee97d49f`
