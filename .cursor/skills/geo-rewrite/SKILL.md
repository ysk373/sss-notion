---
name: geo-rewrite
description: |
  SSS Blog の公開記事を GEO 向けにリライトする。ユーザーが記事リライト・GEO改善・本文の直しを依頼したときに使う。
  手動チェックリストは使わず、geo-audit の結果を正として Notion 本文を更新する。
---

# GEO 記事リライト

## 1. 監査を実行

```bash
npm run geo:audit
# 特定記事のみ: npm run geo:audit -- --slug <slug>
```

`tmp/geo-audit.json` の `needsRewrite`（`score` 降順）をリライト対象とする。

## 2. issue ごとの自動修正方針

| issue                               | 対応                                                 |
| ----------------------------------- | ---------------------------------------------------- |
| `missing_excerpt` / `excerpt_short` | Excerpt を結論 1〜2 文で更新                         |
| `no_h2` / `h2_not_query_like`       | H2 を検索クエリに近い質問形に分割・改名              |
| `intro_thin`                        | 冒頭 2〜3 段落に「誰向け・得られること・結論」を追加 |
| `no_external_link`                  | 公式ドキュメント等の一次リンクを追加                 |
| `howto_no_numbered_list`            | 手順を番号リスト化                                   |
| `no_freshness_marker`               | 冒頭か Excerpt に `YYYY年M月時点` を 1 行追加        |

語数だけ削らない。1 記事 1 意図。シリーズ記事は `series-*` 目次への言及を維持。

## 3. Notion 更新

- Notion MCP または `@notionhq/client` で本文・Excerpt を更新
- 改訂後は `LastUpdated` を当日に設定
- 投資タグ記事は推奨・銘柄勧誘を入れない（`InvestmentDisclaimer` はサイト側）

## 4. 完了確認

```bash
npm run geo:audit -- --slug <slug>
```

対象の `score` が 0、または残 issue が許容範囲であること。

## 5. サイト反映

```bash
npm run geo:llms
npm run build
```
