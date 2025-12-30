# astro-notion-blog - SSS Notion Project

## 1. プロジェクト概要
**目的**: Notionをコンテンツ管理システムとして使用した個人技術ブログ (SSS blog) の運営  
**ベース**: [otoyo/astro-notion-blog](https://github.com/otoyo/astro-notion-blog) v0.10.0
**リポジトリ**: [ysk373/sss-notion](https://github.com/ysk373/sss-notion)

**主要機能**:
- Notionで記事を執筆・管理
- 静的サイト生成（SSG）による高速表示
- タグベースの記事分類
- RSSフィード生成
- Cloudflare R2による画像管理

**ターゲット読者**: 組み込みシステムエンジニア、DSP開発者、自動車業界技術者

---

## 2. 技術スタック
- **フレームワーク**: Astro 5.x (Static Site Generator)
- **言語**: TypeScript, JavaScript
- **スタイリング**: Vanilla CSS (Scoped Styles & CSS Variables)
- **パッケージマネージャー**: npm
- **コンテンツ管理**: Notion API（Content Collectionsではない）
- **画像ストレージ**: Cloudflare R2 (`images.sssstudy.com`)
- **ホスティング**: GitHub Pages
- **DNS/CDN**: Cloudflare
- **コンテナ**: Docker (開発環境用)

---

## 3. プロジェクト構造
```
sss-notion/
├── .github/                # CI/CD設定
├── public/                 # 静的アセット
│   └── favicon/           # ファビコン
├── scripts/                # ビルドスクリプト
│   ├── blog-contents-cache.cjs  # コンテンツキャッシュ
│   ├── retrieve-block-children.cjs
│   └── r2-upload.cjs      # R2画像アップロード
├── src/
│   ├── components/        # UIコンポーネント (56ファイル)
│   ├── images/            # 画像アセット
│   ├── integrations/      # Astro統合
│   ├── layouts/           # ページレイアウト
│   │   └── Layout.astro   # ベースレイアウト
│   ├── lib/               # ユーティリティ
│   │   └── notion/        # Notion API連携
│   ├── pages/             # ルーティング
│   │   ├── index.astro    # トップページ（記事一覧）
│   │   ├── feed.ts        # RSSフィード
│   │   └── posts/         # 記事ページ
│   │       ├── [slug].astro      # 個別記事
│   │       ├── page/[page].astro # ページネーション
│   │       └── tag/[tag].astro   # タグ別一覧
│   ├── styles/            # グローバルスタイル
│   │   └── sss-theme.css  # SSSテーマ設定
│   └── server-constants.ts # サーバー定数
├── tmp/                    # キャッシュファイル（gitignore済み）
├── astro.config.mjs        # Astro設定
├── docker-compose.yml      # Docker構成
├── Dockerfile              # 開発コンテナ
└── package.json            # 依存関係
```

---

## 4. ルーティング

| URL | 説明 |
|-----|------|
| `/` | トップページ（記事一覧） |
| `/posts/[slug]` | 個別記事ページ |
| `/posts/page/[page]` | 記事一覧のページネーション |
| `/posts/tag/[tag]` | タグ別記事一覧 |
| `/posts/tag/[tag]/page/[page]` | タグ別ページネーション |
| `/feed` | RSSフィード |

---

## 5. 基本コマンド

```bash
# Docker開発環境
docker-compose up --build    # 開発サーバー起動（ホットリロード対応）
docker-compose down          # コンテナ停止

# ローカル開発（Docker不使用の場合）
npm install                  # 依存関係インストール
npm run dev                  # 開発サーバー起動
npm run build                # 本番ビルド
npm run preview              # ビルド後プレビュー

# キャッシュ管理
npm run cache:fetch          # Notionコンテンツをキャッシュ
npm run cache:purge          # キャッシュをクリア

# 画像管理（R2）
npm run r2:upload -- <ファイルパス> [保存先パス]
npm run r2:delete -- <R2キー>  # 画像の削除
```

---

## 6. コンテンツ管理（Notion）

### 記事の追加・編集
1. **Notionで直接編集**: NotionのデータベースUIで記事を作成・編集
2. **再デプロイ**: 変更を反映するにはデプロイが必要（SSGのため）

### Notionデータベースのプロパティ
| プロパティ | 型 | 説明 |
|-----------|-----|------|
| Name | Title | 記事タイトル |
| Published | Checkbox | 公開フラグ |
| Slug | Text | URL用スラッグ |
| Date | Date | 公開日 |
| Tags | Multi-select | タグ（複数選択可） |
| Excerpt | Text | 記事の要約 |
| Rank | Number | 推奨記事の順位 |
| FeaturedImage | Files | サムネイル画像 |

---

## 7. 環境変数

`.env` ファイルに以下を設定：
```env
# Notion設定
NOTION_API_SECRET=secret_xxxxxxxxxxxxx  # Notion Integration Token
DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxx     # NotionデータベースID

# Cloudflare R2設定
R2_ACCOUNT_ID=xxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
R2_BUCKET_NAME=sss-blog-images
R2_PUBLIC_URL=https://images.sssstudy.com
```

---

## 8. 画像管理（Cloudflare R2）

### 概要
記事用の画像（サムネイル、本文内画像）はCloudflare R2で管理します。
- **バケット名**: `sss-blog-images`
- **公開URL**: `https://images.sssstudy.com`

### アップロード方法
```bash
# 基本的なアップロード（ファイル名自動生成）
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
MCPの `API-patch-page` を使用してFeaturedImageにR2のURLを設定：
```json
{
  "page_id": "{ページID}",
  "properties": {
    "FeaturedImage": {
      "files": [{
        "type": "external",
        "name": "thumbnail.png",
        "external": { "url": "https://images.sssstudy.com/thumbnails/xxx.png" }
      }]
    }
  }
}
```

---

## 9. コーディング規約

### 全般
- インデントはタブ（2スペース相当）
- セミコロン必須
- 複雑なロジックには日本語コメント必須

### Astroコンポーネント
- ファイル名はPascalCase (`PostCard.astro`)
- PropsはTypeScriptで型定義
- CSSはスコープドスタイル + CSS変数を使用

### パフォーマンス
- 画像は適切なフォーマット（WebP/SVG）を使用
- ビルド時生成（SSG）を基本とする

---

## 10. 禁止事項

- **外部CSSフレームワーク禁止** (Bootstrap, Tailwind等) → Vanilla CSS使用
- **jQuery等のレガシーライブラリ禁止** → Vanilla JS/TypeScript使用
- **APIキー・シークレットのハードコード禁止** → .env使用
- **public/への無秩序なファイル配置禁止** → フォルダ分けを徹底

---

## 11. 開発時の注意事項

### Docker使用時
- Layout.astroなどの変更がホットリロードで反映されない場合がある
- 反映されない場合は `docker-compose down` → `docker-compose up --build`

### Notion API
- 開発モードではNotion APIへリアルタイムアクセスするため遅い（1-2秒/ページ）
- 本番ビルド後は静的HTMLのため高速

---

## 12. デプロイ

### GitHub Pages（現在の構成）
- GitHub ActionsによるCI/CDでデプロイ
- プッシュ時に自動ビルド・デプロイ

### 記事更新時
Notionで記事を更新後、デプロイをトリガーする必要がある（SSGのため）
- GitHub ActionsでワークフローをRe-run
- 手動デプロイ

---

## 13. MCP連携（AI記事作成）

### Notion MCP
Notion MCPを使用して、AIエージェントが直接Notionに記事を作成・編集できます。

### データベースID
```
SSS Blog: 2d82403f-bc5c-819f-a7f6-f1caee97d49f
```

### 利用可能なMCPツール
| ツール | 説明 |
|--------|------|
| `API-post-search` | ページ・データベースを検索 |
| `API-post-page` | 新規ページを作成 |
| `API-patch-page` | ページプロパティを更新 |
| `API-patch-block-children` | ページに本文を追加 |
| `API-retrieve-a-page` | ページ情報を取得 |
| `API-get-block-children` | ブロックの子要素を取得 |

### ワークフロー
| コマンド | 説明 |
|----------|------|
| `/create_blog_post` | MCP経由で新規記事を作成 |
| `/create_story` | MCP経由で短編小説を作成 |
| `/add_thumbnail` | サムネイル画像を設定（R2アップロード対応） |
