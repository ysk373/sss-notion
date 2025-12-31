---
description: 記事用のサムネイル画像を追加・最適化する（R2アップロード対応）
---

# サムネイル画像の追加

astro-notion-blogでは、サムネイル画像はNotionのFeaturedImageプロパティから設定します。
画像はCloudflare R2にアップロードし、永続的なURLで管理します。

## 方法1: R2経由でサムネイル設定（推奨）

### ステップ1: 画像をR2にアップロード

```bash
# 基本的なアップロード
npm run r2:upload -- ./画像.png

# 保存先を指定する場合（推奨）
npm run r2:upload -- ./画像.png thumbnails/記事スラッグ.png
```

出力例:

```
✅ アップロード成功!
📍 URL: https://images.sssstudy.com/thumbnails/記事スラッグ.png
🔑 Key: thumbnails/記事スラッグ.png
```

### ステップ2: NotionにURLを設定

MCPツール `API-patch-page` を使用：

```json
{
  "page_id": "{記事のページID}",
  "properties": {
    "FeaturedImage": {
      "files": [
        {
          "type": "external",
          "name": "thumbnail.png",
          "external": {
            "url": "https://images.sssstudy.com/thumbnails/記事スラッグ.png"
          }
        }
      ]
    }
  }
}
```

## 方法2: Antigravity画像生成 + R2

### ステップ1: 画像を生成

Antigravityの `generate_image` ツールで画像を生成。
生成された画像は artifacts ディレクトリに保存されます。

### ステップ2: R2にアップロード

```bash
npm run r2:upload -- "生成された画像のパス" thumbnails/記事スラッグ.png
```

### ステップ3: Notionに設定

上記と同様に `API-patch-page` でURLを設定。

## 方法3: Notionで直接アップロード

1. Notionで対象の記事ページを開く
2. FeaturedImageプロパティに画像をアップロード
3. 画像が自動的にNotion CDNでホスティングされる

> **注意**: Notion CDNの画像URLは有効期限があります（約1時間）。
> 本番運用では方法1（R2経由）を推奨します。

## 画像の推奨仕様

| 項目           | 推奨値                 |
| -------------- | ---------------------- |
| サイズ         | 1200x630px (OGP最適化) |
| フォーマット   | PNG, JPG, WebP         |
| ファイルサイズ | 500KB以下              |

## ページIDの取得方法

MCPツール `API-post-search` で記事を検索：

```json
{
  "query": "{記事タイトルの一部}"
}
```

結果から `id` フィールドを取得してください。

## R2のディレクトリ構成（推奨）

```
sss-blog-images/
├── thumbnails/          # 記事サムネイル
│   ├── 記事スラッグ1.png
│   └── 記事スラッグ2.png
├── articles/            # 記事本文内の画像
│   ├── 記事スラッグ1/
│   │   ├── image1.png
│   │   └── image2.png
│   └── 記事スラッグ2/
│       └── diagram.png
└── assets/              # 共通アセット
    └── logo.png
```

## 環境変数

R2アップロードに必要な環境変数（`.env`に設定済み）：

```env
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=sss-blog-images
R2_PUBLIC_URL=https://images.sssstudy.com
```

## 画像の差し替え

画像を差し替える場合は、**必ず古い画像をR2から削除してください**。
ストレージの無駄遣いを防ぎ、管理を容易にするためのプロジェクトルールです。

### 差し替え手順

1. **古い画像を削除**

   ```bash
   npm run r2:delete -- <古い画像のキー>
   ```

   例:

   ```bash
   npm run r2:delete -- thumbnails/old-article.png
   npm run r2:delete -- articles/my-article/old-diagram.png
   ```

2. **新しい画像をアップロード**

   ```bash
   npm run r2:upload -- ./新しい画像.png <同じキーまたは新しいキー>
   ```

3. **（キーを変更した場合）Notionの参照を更新**
   同じキーを使用する場合は、Notionの更新は不要です。

> **重要**: 画像の差し替え時に元の画像は残さないこと。
> これはプロジェクトの基本ルールです。

## Notionの画像キャッシュに注意

Notionは外部URLの画像を内部でキャッシュします。
そのため、**同じURLで画像を差し替えてもNotion上の表示は更新されません**。

### 対処法：キャッシュバスティング

画像を差し替えた場合は、URLにバージョンパラメータを追加してNotionを更新してください：

```
# 元のURL
https://images.sssstudy.com/articles/my-article/image.png

# キャッシュバスティングURL
https://images.sssstudy.com/articles/my-article/image.png?v=2
```

### Notionの更新が必要な箇所

1. **本文内の画像ブロック** - `API-update-a-block` で更新
2. **カバー画像** - `API-patch-page` の `cover` で更新
3. **FeaturedImage** - `API-patch-page` の `properties.FeaturedImage` で更新

> **ヒント**: バージョン番号は `?v=2`, `?v=3` のように差し替えるたびに増やしてください。
