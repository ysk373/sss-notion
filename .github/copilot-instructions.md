# GitHub Copilot Instructions

このリポジトリの AI 向け正本は `AGENTS.md` です。Copilot で提案するコードやドキュメントも、まず `AGENTS.md` の方針に従ってください。

## 要点

- Notion が記事本文の正本です。記事本文をリポジトリ内 Markdown として作らないでください。
- Astro / TypeScript / Vanilla CSS の既存構成に寄せてください。
- コードは最小構成で、初学者にも読みやすい命名と分割にしてください。
- シリーズ目次は `series-*` の Notion ページと `src/constants/series-hubs.ts` で管理します。
- 投資記事の免責は `src/components/InvestmentDisclaimer.astro` を正とします。
- API キーや `.env` の値をコード・ドキュメントに書かないでください。
