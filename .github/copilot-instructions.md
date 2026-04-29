# astro-notion-blog - GitHub Copilot 運用ガイド

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
- **コンテンツ管理**: Notion API（Content Collectionsは使用しない）
- **画像ストレージ**: Cloudflare R2 (`images.sssstudy.com`)
- **ホスティング**: GitHub Pages（SSG必須、サーバーサイドレンダリング不可）
- **DNS/CDN**: Cloudflare
- **コンテナ**: Docker (開発環境用)

---

## 3. プロジェクト構造

```
sss-notion/
├── public/                 # 静的アセット
│   └── favicon/           # ファビコン画像
├── scripts/                # ビルドスクリプト
│   ├── blog-contents-cache.cjs  # コンテンツキャッシュ
│   ├── retrieve-block-children.cjs
│   └── r2-upload.cjs      # R2画像アップロード
├── src/
│   ├── components/        # UIコンポーネント（56ファイル）
│   ├── layouts/           # ページレイアウト
│   │   └── Layout.astro   # ベースレイアウト
│   ├── lib/               # ユーティリティ
│   │   └── notion/        # Notion API連携
│   ├── pages/             # ルーティング
│   │   ├── index.astro    # トップページ（記事一覧）
│   │   ├── feed.ts        # RSSフィード
│   │   └── posts/         # 記事ページ
│   │       ├── [slug].astro
│   │       └── tag/[tag].astro
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

# キャッシュ管理
npm run cache:fetch          # Notionコンテンツをキャッシュ
npm run cache:purge          # キャッシュをクリア

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

### データベースID

```
SSS Blog: 2d82403f-bc5c-819f-a7f6-f1caee97d49f
```

---

## 6. 画像管理（Cloudflare R2）

- **バケット名**: `sss-blog-images`
- **公開URL**: `https://images.sssstudy.com`

### ディレクトリ構成（推奨）

```
sss-blog-images/
├── thumbnails/          # 記事サムネイル
├── articles/            # 記事本文内の画像
│   └── {記事スラッグ}/
└── assets/              # 共通アセット
```

### 記事本文内画像のガイドライン

#### スタイル
- **手書き風（ホワイトボードスケッチ）スタイルを採用する**
  - 鉛筆・ペン書き風のラフなスケッチスタイル
  - 白背景に黒インクのシンプルな図解
  - 洗練されたデザインよりも、読者の理解を助けることを優先する
- 生成プロンプトには以下を含める: `hand-drawn whiteboard sketch`, `rough pencil sketch style`, `white background`, `educational illustration`

#### 挿入位置
- **記事の途中、説明の補助として挿入する**（冒頭や末尾にまとめて置かない）
- 図解する内容の直前・直後に配置する（説明→画像の順が自然）
- 1記事あたり2枚程度を目安に、記事内で分散して配置する
- 例: 概念説明の直後、コードブロックの前、手順の要約として

#### Notionページへの追加手順
1. `node C:/dev/git/scripts/generate-image.js "プロンプト"` で手書き風画像を生成
2. `npm run r2:upload -- <生成ファイルパス> articles/{スラッグ}/image-name.png` でR2にアップロード
3. Notion MCPで `update_content` を使い、対象セクションの直後に挿入:
   - `old_str`: 挿入したい場所の直前のテキスト
   - `new_str`: 同テキスト + `\n\n![説明](https://images.sssstudy.com/articles/{スラッグ}/image-name.png)\n\n`

### 画像差し替え時のルール

**既存の画像を新しい画像に置き換えた場合、必ず旧画像をR2から削除すること。**

```bash
# 旧画像を削除してから新画像をアップロードする
npm run r2:delete -- articles/{スラッグ}/old-image.png
npm run r2:upload -- ./new-image.png articles/{スラッグ}/new-image.png
```

- 差し替えた画像を放置するとR2に孤立ファイルが蓄積する
- 記事スラッグを変更した場合も旧スラッグディレクトリの画像をすべて削除する
- サムネイル（`thumbnails/`）を差し替えた場合も同様に旧ファイルを削除する

### Notionへの画像設定（サムネイル）

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

### 画像キャッシュバスティング

Notionは外部URLをキャッシュするため、同URLでの差し替えは反映されない。  
差し替え時はURLにバージョンパラメータを追加：

```
https://images.sssstudy.com/articles/my-article/image.png?v=2
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

- インデントはタブ（2スペース相当）
- セミコロン必須
- 複雑なロジックには日本語コメント必須
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

## 10. 開発上の注意

- Docker使用時はホットリロードに時間がかかる場合がある
- Notion APIレスポンスは遅い場合があるが正常動作
- 本番はSSG（静的HTML）のため高速、開発時はAPIアクセスで遅い

### トラブルシューティング

| 問題 | 対処 |
|---|---|
| 変更がブラウザに反映されない | `docker-compose down && docker-compose up --build` |
| 新しい記事が表示されない | Notionで`Published`チェックを確認 → 再デプロイ |
| 開発サーバーが遅い | Notion APIリアルタイムアクセスによる正常動作 |

---

## 11. Git運用

```bash
git pull
git add -A
git commit -m "feat: {変更内容}"
git push
```

**コミットメッセージ規約**: `feat:` / `fix:` / `docs:` / `style:`

---

## 12. MCP連携

### 利用可能なMCPツール

| ツール | 説明 |
|---|---|
| `API-post-page` | 新規ページを作成 |
| `API-patch-page` | ページプロパティを更新 |
| `API-patch-block-children` | ページに本文ブロックを追加 |
| `API-post-search` | ページ・データベースを検索 |
| `API-update-a-block` | 既存ブロックを更新 |

### 画像生成（generate-image.js）

```bash
node $GENERATE_IMAGE_SCRIPT "プロンプト"
```

- 環境変数 `GENERATE_IMAGE_SCRIPT`: `C:\dev\git\scripts\generate-image.js`
- 環境変数 `GEMINI_IMAGE_API_KEY`: Gemini APIキー
- モデル: `gemini-3.1-flash-image-preview`
- 出力パス省略時はシステム一時ディレクトリに保存

#### ブロック図・アーキテクチャ図のプロンプト作成ルール

AIが余分な線・ボックスを生成する問題を防ぐため、以下を厳守する:

1. **要素数を明示** — `Draw EXACTLY [N] rectangular boxes and [M] arrows`
2. **各要素を番号付きで列挙** — `(1) Box labeled 'A', (2) Box labeled 'B' ...`
3. **矢印を向き・ラベル付きで指定** — `arrow pointing RIGHT from 'A' to 'B', labeled 'ラベル' above`
4. **余計な要素を禁止** — `Draw ONLY these [N] boxes and [M] arrows. NO extra lines, NO extra boxes.`
5. **テキスト誤字防止** — `All text must be spelled correctly. No typos.`

**パターン別テンプレート**:
- 縦積みアーキテクチャ: `Vertical layout top-to-bottom. Exactly [N] boxes stacked.`
- 左右クライアント-サーバー: `LEFT box labeled 'Client'. RIGHT box labeled 'Server'. Arrows between them in order top-to-bottom.`
- 時系列ステップ: `[N] sequential steps arranged LEFT-TO-RIGHT with arrows between consecutive steps.`
- 階層構造: `Hierarchical: [A] at top, [B] and [C] at middle level, [D] at bottom. Arrows from [A] to [B] and [A] to [C]. Arrows from [B] and [C] converge to [D].`

### 利用可能なPrompt Files（`.github/prompts/`）

| プロンプト | 説明 |
|---|---|
| `create-blog-post` | MCP経由で新規ブログ記事を作成 |
| `create-story` | MCP経由で短編小説を作成 |
| `add-thumbnail` | サムネイル画像を設定（画像生成 + R2アップロード） |
| `nano-banana-pro` | 画像生成（generate-image.js / Gemini API） |
