---
description: |
  記事用のサムネイル画像を追加・最適化するワークフロー。
  ユーザーが「サムネイルを設定して」「アイキャッチを追加して」「サムネイルを作って」と言った時に使用する。
  generate-image.js（Gemini API画像生成）で画像を生成し、Cloudflare R2にアップロードし、
  NotionのFeaturedImageプロパティに設定する一連の流れを実行する。
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

- 環境変数 `GENERATE_IMAGE_SCRIPT`: `C:\dev\git\scripts\generate-image.js`
- 環境変数 `GEMINI_IMAGE_API_KEY`: Gemini APIキー
- モデル: `gemini-3.1-flash-image-preview`
- 出力パス省略時はシステム一時ディレクトリに保存
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

## 画像の差し替え

1. **古い画像を削除**

   ```bash
   npm run r2:delete -- <古い画像のキー>
   ```

2. **新しい画像をアップロード**

   ```bash
   npm run r2:upload -- ./新しい画像.png <同じキーまたは新しいキー>
   ```

3. **（キーを変更した場合）Notionの参照を更新**

> **重要**: 画像の差し替え時に元の画像は残さないこと。

## Notionの画像キャッシュに注意

Notionは外部URLをキャッシュするため、同URLでの差し替えは反映されない。  
差し替え時はURLにバージョンパラメータを追加：

```
https://images.sssstudy.com/articles/my-article/image.png?v=2
```
