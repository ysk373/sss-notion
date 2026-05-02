# SSS Notion Project AI Guide

このファイルを、Cursor / Claude / Gemini / GitHub Copilot 向けルールの正本とする。各ツール固有ファイルには、このファイルへの参照と最小限の補足だけを書く。

## 基本方針

- 回答・作業メモ・ユーザー向け説明は日本語で行う。
- コード生成は最小構成を優先し、初学者にも追える命名・分割・コメントにする。
- 既存の構成に寄せ、不要な抽象化や大きなリファクタリングを避ける。
- 秘密情報はコミットしない。`.env` や API キーは参照だけに留める。

## プロジェクト概要

- サイト: `https://sssstudy.com/`
- 目的: Notion を CMS として使う個人ブログ「30代エンジニアの備忘録」の運営。
- 主な読者: 組み込みシステムエンジニア、DSP 開発者、自動車業界技術者、投資に関心のある会社員・主婦。
- ベース: `otoyo/astro-notion-blog` v0.10.0。
- ホスティング: GitHub Pages。SSG 前提で、Notion 更新後は再ビルドが必要。

## 技術スタック

- Astro 5 / TypeScript / JavaScript
- Vanilla CSS と CSS Variables。外部 CSS フレームワークは追加しない。
- Notion API をコンテンツソースにする。記事本文をリポジトリ内 Markdown として管理しない。
- Cloudflare R2 を記事画像・サムネイルの保管先にする。

## よく使うコマンド

```bash
npm run dev
npm run build
npm run preview
npm run cache:fetch
npm run cache:purge
npm run r2:upload -- <file> [key]
npm run r2:delete -- <key>
```

## Notion コンテンツ管理

SSS Blog の Notion データベース ID:

```text
2d82403f-bc5c-819f-a7f6-f1caee97d49f
```

主要プロパティ:

- `Page`: 記事タイトル
- `Published`: 公開フラグ
- `Slug`: `/posts/<slug>/` の URL 末尾
- `Date`: 公開日
- `Tags`: タグ
- `Excerpt`: 記事要約
- `Rank`: おすすめ表示の順位
- `FeaturedImage`: サムネイル画像

固定ページとして扱う Slug:

- `about`: 運営者情報
- `contact`: お問い合わせ
- `privacy-policy`: プライバシーポリシー
- `disclaimer`: 免責事項

固定ページは `src/lib/notion/client.ts` の `FIXED_PAGE_SLUGS` と同期する。

## シリーズ目次運用

記事の重複統合より、シリーズ単位の目次ページと内部リンクを優先する。各回の記事に大量の前後リンクを手で持たせず、シリーズの集約点を 1 ページにする。

作成済みの目次 Slug:

- `series-turtlebot3-ros2`: TurtleBot3 x ROS2 環境構築
- `series-ros2-intro`: ROS2 入門
- `series-investing-nisa`: 投資・新NISA 学習記事ロードマップ
- `series-build-link`: コンパイル・リンク・ビルド
- `series-astro-notion`: Astro x Notion ブログ構築
- `series-signal-processing`: 信号処理
- `series-web-design`: Web デザイン・UI

サイト側の導線は次で管理する。

- `src/constants/series-hubs.ts`: 記事が属する目次を判定する正本
- `src/components/SeriesHubNotice.astro`: 記事上部の目次リンク表示
- `scripts/export-content-posts.mjs`: 公開記事の棚卸し
- `scripts/create-series-hub-pages.mjs`: Notion に目次ページを作成

新しいシリーズを追加するとき:

1. Notion 側に `series-*` の目次ページを作る。
2. `src/constants/series-hubs.ts` に判定ルールを追加する。
3. 必要なら `scripts/create-series-hub-pages.mjs` の作成ロジックにも追加する。
4. `npm run build` でリンク・ビルドを確認する。

既存の全記事共通の前後記事リンクは公開日順であり、シリーズ順ではない。シリーズ順の案内は目次ページで担保する。

## 投資記事の免責

投資・新NISA・株式投資タグの記事には、共通免責を表示する。

- 表示コンポーネント: `src/components/InvestmentDisclaimer.astro`
- 判定: `src/constants/series-hubs.ts` の `isInvestmentPost()`

免責の文章を変える場合は、Notion の各記事へ個別に重ねるより、このコンポーネントを先に更新する。記事本文では特定商品の購入・売却を推奨しない。必要に応じて `disclaimer` ページへ誘導する。

## 画像・R2 運用

- 本文中の説明補助画像は手書き風の図解を基本にする。
- 画像は R2 にアップロードし、Notion には公開 URL を貼る。
- 画像差し替え時は旧 R2 オブジェクトを削除する。
- 記事本文内画像は、説明箇所の直前・直後に置く。冒頭や末尾へまとめ置きしない。

## コーディング規約

- 既存の Astro / TypeScript の書き方に寄せる。
- コンポーネント名は PascalCase。
- Props は TypeScript で型定義する。
- CSS はスコープドスタイルと既存 CSS 変数を使う。
- 追加するコードは小さく、読みやすく、責務を分けすぎない。
- 複雑な処理にだけ短いコメントを書く。

## 検証

コード変更後は、可能な範囲で次を確認する。

```bash
npm run build
```

Notion API トークンや環境変数の問題でビルドできない場合は、その理由を報告する。ドキュメントのみの変更ならビルド不要。
