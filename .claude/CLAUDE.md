# astro-notion-blog - AI Agent 運用ガイド

## 1. プロジェクト概要

**目的**: Notionをコンテンツ管理システムとして使用した個人技術ブログ (SSS blog) の運営  
**ベース**: [otoyo/astro-notion-blog](https://github.com/otoyo/astro-notion-blog) v0.10.0

**主要機能**:

- Notionで記事を執筆・管理（Markdownファイル不要）
- 静的サイト生成（SSG）による高速表示
- タグベースの記事分類
- RSSフィード生成
- Cloudflare R2による画像管理

**ターゲット読者**: 組み込みシステムエンジニア、DSP開発者、自動車業界技術者、投資に興味を持っているサラリーマンと主婦

---

## 2. 技術スタック

- **フレームワーク**: Astro 5.x (Static Site Generator)
- **言語**: TypeScript, JavaScript
- **スタイリング**: Vanilla CSS (Scoped Styles & CSS Variables)
- **パッケージマネージャー**: npm
- **コンテンツ管理**: Notion API
- **画像ストレージ**: Cloudflare R2 (`images.sssstudy.com`)
- **ホスティング**: GitHub Pages
- **DNS/CDN**: Cloudflare
- **コンテナ**: Docker (開発環境用)

---

## 3. プロジェクト構造

```
sss-notion/
├── public/                 # 静的アセット
│   └── favicon/           # ファビコン画像
├── scripts/                # ビルドスクリプト
│   └── r2-upload.cjs      # R2画像アップロード
├── src/
│   ├── components/        # UIコンポーネント
│   ├── layouts/           # ページレイアウト
│   │   └── Layout.astro   # ベースレイアウト
│   ├── lib/               # ユーティリティ
│   │   └── notion/        # Notion API連携
│   ├── pages/             # ルーティング
│   │   ├── index.astro    # トップページ（記事一覧）
│   │   ├── feed.ts        # RSSフィード
│   │   └── posts/         # 記事ページ
│   ├── styles/            # グローバルスタイル
│   └── server-constants.ts
├── tmp/                    # キャッシュファイル
├── astro.config.mjs
├── docker-compose.yml
└── package.json
```

---

## 4. 基本コマンド

```bash
# Docker開発環境
docker-compose up --build    # 開発サーバー起動
docker-compose down          # コンテナ停止

# ローカル開発
npm run dev                  # 開発サーバー起動
npm run build                # 本番ビルド
npm run preview              # ビルド後プレビュー

# 画像管理（R2）
npm run r2:upload -- <ファイルパス> [保存先パス]
npm run r2:delete -- <R2キー>  # 画像の削除
```

---

## 5. コンテンツ管理

### 記事の追加・編集

**重要**: このプロジェクトではMarkdownファイルは使用しません。  
記事の追加・編集はすべて **Notion** で行います。

1. Notionのデータベースで記事を作成・編集
2. GitHub Actions等で再デプロイして公開

### Notionデータベースのプロパティ

| プロパティ    | 型           | 説明               |
| ------------- | ------------ | ------------------ |
| Name          | Title        | 記事タイトル       |
| Published     | Checkbox     | 公開フラグ         |
| Slug          | Text         | URL用スラッグ      |
| Date          | Date         | 公開日             |
| Tags          | Multi-select | タグ（複数選択可） |
| Excerpt       | Text         | 記事の要約         |
| Rank          | Number       | 推奨記事の順位     |
| FeaturedImage | Files        | サムネイル画像     |

---

## 6. 画像管理（Cloudflare R2）

### 概要

記事用の画像（サムネイル、本文内画像）はCloudflare R2で管理します。

- **バケット名**: `sss-blog-images`
- **公開URL**: `https://images.sssstudy.com`

### アップロード方法

```bash
# 基本的なアップロード
npm run r2:upload -- ./image.png

# 保存先パスを指定（推奨）
npm run r2:upload -- ./image.png thumbnails/my-article.png
```

### ディレクトリ構成（推奨）

```
sss-blog-images/
├── thumbnails/          # 記事サムネイル
├── articles/            # 記事本文内の画像
│   └── {記事スラッグ}/
└── assets/              # 共通アセット
```

### Notionへの画像設定

MCPの `API-patch-page` を使用：

```json
{
  "page_id": "{ページID}",
  "properties": {
    "FeaturedImage": {
      "files": [
        {
          "type": "external",
          "name": "thumbnail.png",
          "external": {
            "url": "https://images.sssstudy.com/thumbnails/xxx.png"
          }
        }
      ]
    }
  }
}
```

---

## 7. 重要なファイル

| ファイル                          | 説明                          |
| --------------------------------- | ----------------------------- |
| `src/pages/index.astro`           | トップページ（記事一覧）      |
| `src/pages/posts/[slug].astro`    | 個別記事ページ                |
| `src/pages/posts/tag/[tag].astro` | タグ別記事一覧                |
| `src/layouts/Layout.astro`        | ベースレイアウト              |
| `src/styles/sss-theme.css`        | SSSテーマ（カラー・フォント） |
| `src/lib/notion/client.ts`        | Notion APIクライアント        |
| `scripts/r2-upload.cjs`           | R2画像アップロードスクリプト  |

---

## 8. コーディング規約

### 全般

- インデントはタブ（2スペース相当）
- セミコロン必須
- 複雑なロジックには日本語コメント必須

### Astroコンポーネント

- ファイル名はPascalCase (`PostCard.astro`)
- PropsはTypeScriptで型定義
- CSSはスコープドスタイル + CSS変数を使用

---

## 9. 禁止事項

- **外部CSSフレームワーク禁止** (Bootstrap, Tailwind等) → Vanilla CSS使用
- **jQuery等のレガシーライブラリ禁止** → Vanilla JS/TypeScript使用
- **APIキー・シークレットのハードコード禁止** → .env使用
- **public/への無秩序なファイル配置禁止** → フォルダ分けを徹底

---

## 10. トラブルシューティング

### 変更がブラウザに反映されない

1. Docker使用時: `docker-compose down` → `docker-compose up --build`
2. ブラウザのキャッシュをクリア（Ctrl+Shift+R）

### 開発サーバーが遅い

- これはNotion APIへのリアルタイムアクセスによる正常な動作です
- 本番ビルド後は静的HTMLのため高速に動作します

### 新しい記事が表示されない

1. Notionで「Published」チェックボックスがオンになっているか確認
2. 再デプロイが必要（SSGのため）

---

## 11. Git運用

```bash
# 変更のプルとプッシュ
git pull
git add -A
git commit -m "feat: {変更内容}"
git push
```

**コミットメッセージ規約**:

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント更新
- `style:` スタイル変更

---

## 12. MCP連携（AI記事作成）

### Notion MCP

Notion MCPを使用して、AIが直接Notionに記事を作成・編集できます。

### データベースID

```
SSS Blog: 2d82403f-bc5c-819f-a7f6-f1caee97d49f
```

### 利用可能なワークフロー

| コマンド            | 説明                                       |
| ------------------- | ------------------------------------------ |
| `/create_blog_post` | MCP経由で新規ブログ記事を作成              |
| `/create_story`     | MCP経由で短編小説を作成（storiesタグ付き） |
| `/add_thumbnail`    | サムネイル画像を設定（R2アップロード対応） |

### 主要MCPツール

- `API-post-page`: 新規ページを作成
- `API-patch-page`: ページプロパティを更新
- `API-patch-block-children`: ページに本文を追加
- `API-post-search`: ページ・データベースを検索
