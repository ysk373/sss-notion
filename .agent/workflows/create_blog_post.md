---
description: Notionで新しいブログ記事を作成する手順を案内する
---

# MCP経由でブログ記事を作成

Notion MCPを使用して、AIが直接Notionに記事を作成します。

## 手順

### 1. ユーザーに記事情報を確認

以下の情報をユーザーに尋ねてください：

- **タイトル**: 記事のタイトル
- **スラッグ**: URL用のスラッグ（例: `my-first-post`）
- **タグ**: カテゴリータグ（Diary, How-to, Introduction, Document から選択）
- **要約**: 記事の要約（SEO用、1-2文）
- **本文**: 記事の内容（見出しと本文）

### 記事の執筆ルール（Tone & Manner）

記事を作成する際は、以下のルールに従ってください：

1. **親しみやすい口調**: 「〜である」調は禁止。「〜だよ」「〜しちゃおう！」「〜ですね」など、読者に語りかけるフレンドリーな口調を使用。
2. **体験・感動ベース**: 機能説明（〜できる）よりも、著者の体験（〜してみたら感動した、〜で困っていた）を重視。「実際に使ってどう感じたか」を熱量高く伝える。
3. **視覚的要素の多用**:
   - **絵文字**: 文末や強調したい箇所に積極的に使用（😂, 😭, 😱, 💪, ✨など）。
   - **チェックリスト**: 冒頭の「この記事でわかること」や「まとめ」は ✅ を使ったリスト形式にする。
   - **Calloutブロック**: 補足やヒントは 💡 アイコンのCalloutブロックを使用。
4. **Before/After構成**: 冒頭で「困っていた過去（Before）」と「解決した現在（After）」を対比させ、読者の共感を呼ぶ導入にする。

### 構成テンプレート

- **導入**: 困っていた状況(Before) vs 解決後の喜び(After) + この記事でわかること(✅リスト)
- **本文**: 体験談を交えた解説。専門用語は噛み砕く。
- **まとめ**: メリットの再確認(✅リスト) + 読者への推奨メッセージ

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
    "Tags": { "multi_select": [{ "name": "{タグ}" }] },
    "Excerpt": { "rich_text": [{ "text": { "content": "{要約}" } }] },
    "Published": { "checkbox": true }
  }
}
```

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
        "rich_text": [{ "type": "text", "text": { "content": "{見出し}" } }]
      }
    },
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "{本文}" } }]
      }
    }
  ]
}
```

### 5. 確認

- 開発サーバー再起動が必要な場合: `docker-compose down && docker-compose up --build`
- 記事URL: `http://localhost:4321/posts/{スラッグ}`

## 利用可能なブロックタイプ

- `heading_1`, `heading_2`, `heading_3`: 見出し
- `paragraph`: 段落
- `bulleted_list_item`: 箇条書き
- `numbered_list_item`: 番号付きリスト
- `code`: コードブロック
- `quote`: 引用

## データベースID

SSS Blog: `2d82403f-bc5c-819f-a7f6-f1caee97d49f`
