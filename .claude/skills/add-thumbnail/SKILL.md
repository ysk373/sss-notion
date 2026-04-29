---
name: add-thumbnail
description: |
  記事用のサムネイル画像を追加・最適化するワークフロー。
  generate-image.js（Gemini API画像生成）で画像を生成し、Cloudflare R2にアップロードし、
  NotionのFeaturedImageプロパティに設定する一連の流れを実行する。
context: fork
---

# サムネイル画像の追加

astro-notion-blogでは、サムネイル画像はNotionのFeaturedImageプロパティから設定します。
画像はCloudflare R2にアップロードし、永続的なURLで管理します。

## 方法1: 画像生成 + R2アップロード（推奨）

### ステップ1: 画像を生成

`generate-image.js` スクリプトを使用して画像を生成します。

```bash
node $GENERATE_IMAGE_SCRIPT "プロンプト"
```

- 環境変数 `GENERATE_IMAGE_SCRIPT` にスクリプトのパスを設定（`C:\dev\git\scripts\generate-image.js`）
- 環境変数 `GEMINI_IMAGE_API_KEY` にGemini APIキーを設定
- モデル: `gemini-3.1-flash-image-preview`
- 出力パス省略時はシステム一時ディレクトリに保存（ローカルにファイルが溜まらない）
- 出力先のパスはコンソールに表示されるので、R2アップロード時に使用する

サムネイル画像の推奨プロンプト要素：
- 記事の内容を視覚的に表現するイメージ
- シンプルで目を引くデザイン
- テキストが読みやすい背景
- アスペクト比16:9、1200x630px相当の構図を指定

### ステップ2: R2にアップロード

コンソールに表示された一時ファイルのパスを使用:

```bash
npm run r2:upload -- "/tmp/generate-image-xxxxx.png" thumbnails/記事スラッグ.png
```

出力例:
```
アップロード成功!
URL: https://images.sssstudy.com/thumbnails/記事スラッグ.png
Key: thumbnails/記事スラッグ.png
```

### ステップ3: NotionにURLを設定

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

## 方法2: 既存画像をR2経由で設定

### ステップ1: 画像をR2にアップロード

```bash
npm run r2:upload -- ./画像.png thumbnails/記事スラッグ.png
```

### ステップ2: NotionにURLを設定

上記ステップ3と同様に `API-patch-page` でURLを設定。

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

## 画像の差し替え

画像を差し替える場合は、**必ず古い画像をR2から削除してください**。

### 差し替え手順

1. **古い画像を削除**
   ```bash
   npm run r2:delete -- <古い画像のキー>
   ```

2. **新しい画像をアップロード**
   ```bash
   npm run r2:upload -- ./新しい画像.png <同じキーまたは新しいキー>
   ```

3. **（キーを変更した場合）Notionの参照を更新**
   同じキーを使用する場合は、Notionの更新は不要です。

> **重要**: 画像の差し替え時に元の画像は残さないこと。これはプロジェクトの基本ルールです。

## Notionの画像キャッシュに注意

Notionは外部URLの画像を内部でキャッシュします。
**同じURLで画像を差し替えてもNotion上の表示は更新されません**。

### 対処法：キャッシュバスティング

画像を差し替えた場合は、URLにバージョンパラメータを追加：

```
https://images.sssstudy.com/articles/my-article/image.png?v=2
```

### Notionの更新が必要な箇所

1. **本文内の画像ブロック** - `API-update-a-block` で更新
2. **カバー画像** - `API-patch-page` の `cover` で更新
3. **FeaturedImage** - `API-patch-page` の `properties.FeaturedImage` で更新