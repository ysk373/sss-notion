/**
 * Batch 4: tmp/articles-export -> tmp/rewrites (same block count/order)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORT = join(ROOT, 'tmp/articles-export');
const OUT = join(ROOT, 'tmp/rewrites');

const FRESH = '2026年5月時点';
const QUERY_H2 = /[？?]|とは|手順|方法|やり方|違い|比較/;
const FRESHNESS = /20\d{2}年\d{1,2}月/;
const EXT_LINK = /\[([^\]]+)\]\(https?:\/\/[^)]+\)/;

function load(slug) {
  return JSON.parse(readFileSync(join(EXPORT, `${slug}.json`), 'utf8'));
}

function verbatim(b) {
  return { ...b };
}

function cloneExport(data) {
  return {
    pageId: data.pageId,
    slug: data.slug,
    excerpt: data.excerpt,
    preserveImages: data.preserveImages.map((i) => ({ ...i })),
    blocks: data.blocks.map((b) => ({ ...b })),
  };
}

function setBlock(blocks, i, patch) {
  Object.assign(blocks[i], patch);
}

function auditLocal(data) {
  const issues = [];
  const h2s = data.blocks
    .filter((b) => b.kind === 'heading_2')
    .map((b) => b.text);
  const h1s = data.blocks
    .filter((b) => b.kind === 'heading_1')
    .map((b) => b.text);
  const headings = [...h2s, ...h1s];
  const bodyText = data.blocks.map((b) => b.text || '').join('\n');
  const intro = data.blocks
    .filter((b) => ['paragraph', 'heading_2', 'heading_1'].includes(b.kind))
    .slice(0, 6)
    .map((b) => b.text || '')
    .join('');
  const freshnessText = `${data.excerpt}\n${intro}`;

  if (!headings.some((t) => QUERY_H2.test(t))) {
    issues.push('h2_not_query_like');
  }
  if (!FRESHNESS.test(freshnessText)) {
    issues.push('no_freshness_marker');
  }
  if (
    !EXT_LINK.test(bodyText) &&
    data.blocks.filter((b) => b.kind === 'paragraph').length >= 3
  ) {
    issues.push('no_external_link');
  }
  const isHowTo =
    data.tags?.includes('How-to') ||
    /手順|始め方|構築|セットアップ/.test(data.title);
  if (
    isHowTo &&
    !data.blocks.some((b) => b.kind === 'numbered_list_item') &&
    !/\n\s*1[\.\)、]/.test(bodyText)
  ) {
    issues.push('howto_no_numbered_list');
  }
  return issues;
}

const rewriters = {
  'stm32-gpio-timer-guide'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、HAL で GPIO・タイマー・割込の読みどころを整理。シリーズ差は大きいので CubeMX とデータシートを正として確認するための入門ガイド。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、ARM Cortex-M 系の STM32 を題材に、HAL を使った GPIO・タイマー・割込コールバックの読みどころを整理します。組み込み初学者や HAL から触る人向けで、シリーズ／型番ごとにクロックやバスが違う前提で、最終確認は [STM32CubeMX](https://www.st.com/en/development-tools/stm32cubemx.html) とリファレンスマニュアルに寄せます。`,
    });
    setBlock(b, 1, {
      text: `読み進める前提：クロックツリーが一度「紙に合う」ところまで通っていること。確認のコツは、UART か SWO で周期・デューティ・GPIO トグルを数値ログで1本取ること。うまくいかない典型は、クロックゲート未解放のまま GPIO だけ触る、ISR に処理を詰め込みすぎる、最適化でウォッチが嘘をつく、などです。`,
    });
    setBlock(b, 2, {
      text: `メモリ配置の考え方は [メモリマップ入門｜組み込みエンジニアが知るべきメモリ配置とリンカスクリプト](/posts/memory-map-explained/) と通じますが、ベクタ表・リンカシンボルは教材より Cube/BSP 生成物を正にしてください。`,
    });
    setBlock(b, 4, {
      text: `STM32 は ST の ARM コア MCU ファミリーで、シリーズごとに性能と周辺 IP が異なります（数値はデータシートで必ず確認）。`,
    });
    setBlock(b, 10, {
      text: `STM32CubeMX：GUI でペリフェラル設定と HAL コード生成を行う無料ツール。ピン配置やクロック設定をビジュアルに行える（[公式](https://www.st.com/en/development-tools/stm32cubemx.html)）`,
    });
    setBlock(b, 11, {
      text: `STM32CubeIDE：Eclipse ベースの統合開発環境（無料）。CubeMX 統合済み`,
    });
    setBlock(b, 36, {
      text: 'まとめ：持ち帰りチェック（CubeMX とデータシートを正に）',
    });
    setBlock(b, 37, {
      text: `STM32 は [CubeMX](https://www.st.com/en/development-tools/stm32cubemx.html) でクロックとバスを固めてから HAL の数字を信じるのが安全`,
    });
    return o;
  },

  'cloudflare-r2-blog-system'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、Notion 期限付き画像 URL を避け [Cloudflare R2](https://developers.cloudflare.com/r2/) で安定配信する構成と、バケット・ドメイン・アップロード運用の整理。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、Notion をヘッドレス CMS にしたブログでは、Notion API 経由の画像 URL に有効期限があり、公開からしばらく経つと表示が切れることがあります。R2 に画像を置くと読者側では欠落しにくく、差し替え・削除をオブジェクトキーで管理しやすくなります。本記事では [Cloudflare R2](https://developers.cloudflare.com/r2/) を安定配信先に使った手順と、リポジトリ側の運用メモをまとめます。`,
    });
    setBlock(b, 1, { text: 'Notion 画像の有効期限切れは何が起きる？' });
    setBlock(b, 3, { text: 'Cloudflare R2 で画像をホスティングする方法は？' });
    setBlock(b, 11, {
      text: `Cloudflare ダッシュボードの「R2 Object Storage」から「Create bucket」を選び、バケット名（例：sss-blog-images）を指定して作成します。リージョンは Automatic で問題ありません。詳細は [R2 のドキュメント](https://developers.cloudflare.com/r2/get-started/) を参照してください。`,
    });
    setBlock(b, 18, {
      text: `npm run r2:upload でアップロードから URL 取得まで自動化しています。@aws-sdk/client-s3 で S3 互換エンドポイントに接続する構成です（[R2 と S3 API](https://developers.cloudflare.com/r2/api/s3/)）。`,
    });
    setBlock(b, 24, {
      text: `無料枠の見方：ストレージ・クラス A/B 操作の単価は更新され得るので、[Cloudflare R2 の料金](https://developers.cloudflare.com/r2/pricing/) を転送量・操作回数の想定とあわせてざっくり当てはめます。`,
    });
    setBlock(b, 32, {
      text: `この手順は「Astro × Notion ブログ構築」シリーズ（[series-astro-notion](/posts/series-astro-notion/)）の画像・デプロイを固めるパートです。CMS とホスティングの前提が固まったあとで読むと全体図に載せやすいです。`,
    });
    return o;
  },

  'color-psychology'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、Web の色選びを色彩心理学のヒントと実装チェック（コントラスト・色覚多様性）で整理する実践ガイド。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、色は読み心地や注目のされ方に影響しやすい要素のひとつです（文化・ディスプレイ・文脈で解釈は変わります）。デザイン担当やフロント実装者向けに、「Web で色をどう決めるか」の論点と実装チェックに絞って整理します。`,
    });
    setBlock(b, 2, {
      text: `色は心理や文化で解釈がぶれます。「〜色は必ずこう効く」と断定しにくい範囲で、読み順・安心感づくりのヒントとして使うのが安全です。以降の箇条書きはよく語られる関連づけの例で、自分のコンテンツでは小さく検証する余地を残します。`,
    });
    setBlock(b, 17, {
      text: `美しい色使いだけでなく、すべてのユーザーが読めることが前提です。[WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) が定めるコントラスト比の基準を守りましょう。`,
    });
    setBlock(b, 20, {
      text: `確認例：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) でコントラスト比を測れます。`,
    });
    setBlock(b, 34, {
      text: `パレット生成には [Coolors](https://coolors.co/) や [Adobe Color](https://color.adobe.com/) が便利です。アクセシビリティチェック付きツールを選ぶと効率が上がります。レイアウトと分量は [ミニマルデザインの5原則](/posts/minimal-design/) とも相性が検討しやすいです。`,
    });
    return o;
  },

  'minimal-design'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、ミニマルデザイン5原則（余白・タイポ・色・a11y・レスポンシブ）を CSS 例つきで整理する UI/UX 実践ガイド。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、「Less is More」に基づき要素を増やさず目的を伝えるミニマルデザインを、フロントやデザイン初学者向けに整理します。一発完璧より「削っても意味が残るか」を繰り返す前提で、タイポグラフィ・余白・色・アクセシビリティ・レスポンシブの5論点から実装の観察ポイントをまとめます。`,
    });
    setBlock(b, 4, {
      text: `行長：1行 60〜70 文字（max-width: 65ch）が読みやすいとされる（[MDN: line-height](https://developer.mozilla.org/ja/docs/Web/CSS/line-height) も参照）`,
    });
    setBlock(b, 24, {
      text: `余白・タイポ・色彩の三位一体は [Webデザインと色彩心理学](/posts/color-psychology/) とセットで読み替えやすいです。`,
    });
    return o;
  },

  'typography-tips'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、読みやすい Web タイポを CSS で組む実務7点（フォント・階層・行間・コントラスト・Fluid 等）の整理。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、タイポグラフィは読みやすさ・滞在・ブランド印象に直結します。フロント実装者向けに、サイズ・行間・コントラストの積み上げを CSS 例とともに7論点で整理します。配色文脈は [color-psychology](/posts/color-psychology/)、[minimal-design](/posts/minimal-design/)、シリーズは [series-web-design](/posts/series-web-design/) も参照してください。`,
    });
    setBlock(b, 1, { text: 'Web でフォントはセリフとサンセリフ、どう選ぶ？' });
    setBlock(b, 5, { text: '日本語 Web フォントはどう選ぶ？' });
    setBlock(b, 7, {
      text: `Noto Sans JP / Noto Serif JP：[Google Fonts](https://fonts.google.com/) 等で配信。可読性が高く複数ウェイトを選べる`,
    });
    setBlock(b, 10, { text: '見出しと本文の階層はどう設計する？' });
    setBlock(b, 14, { text: '行間（line-height）はどう調整する？' });
    setBlock(b, 20, { text: 'letter-spacing はどこで触る？' });
    setBlock(b, 23, { text: 'レスポンシブタイポは clamp でどう組む？' });
    setBlock(b, 27, { text: 'コントラスト比とアクセシビリティの基準は？' });
    setBlock(b, 29, {
      text: `[WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) の基準を守りましょう。`,
    });
    setBlock(b, 33, { text: 'CSS 変数でタイポをデザインシステム化するには？' });
    setBlock(b, 37, { text: 'まとめ：タイポは何をセットで揃える？' });
    setBlock(b, 39, {
      text: `モジュラースケールの一覧は [Type Scale](https://typescale.com/) で生成できます。`,
    });
    return o;
  },

  'astro-notion-blog-introduction'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、Notion CMS と Astro SSG で技術ブログを組む astro-notion-blog の全体像と導入メリット（公式リンク付き）。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、Notion を CMS にし Astro で静的生成するブログ構成のメリットを、これから構築するエンジニア向けに整理します。執筆は Notion、公開は高速な静的 HTML、運用コストを抑えたい人に向けた入門です。`,
    });
    setBlock(b, 1, { text: 'astro-notion-blog の技術的特長とは？' });
    setBlock(b, 2, {
      text: `1. Notion で執筆し、[Notion API](https://developers.notion.com/) 経由で記事データを取得する`,
    });
    setBlock(b, 3, {
      text: `2. [Astro](https://docs.astro.build/) で静的 HTML を生成し、[otoyo/astro-notion-blog](https://github.com/otoyo/astro-notion-blog) テンプレートでサイトを組む`,
    });
    setBlock(b, 4, {
      text: `GitHub Pages や Cloudflare Pages と組み合わせた低コスト運用が現実的です。OSS の背景は [GitHub Wiki](https://github.com/otoyo/astro-notion-blog/wiki) を参照してください。`,
    });
    setBlock(b, 6, { text: 'SSG で表示速度はどう変わる？' });
    setBlock(b, 7, {
      text: `[Astro](https://docs.astro.build/) の静的サイト生成（SSG）により、動的 CMS（WordPress など）より表示が軽くなりやすい構成です。`,
    });
    setBlock(b, 8, {
      text: `読み込み速度は直帰率やテクニカル SEO にも効きます。`,
    });
    setBlock(b, 9, {
      text: `体感は [astro-notion-blog のデモ](https://astro-notion-blog.pages.dev/) で確認できます。`,
    });
    setBlock(b, 10, {
      text: `対応 Notion ブロックの一覧はリポジトリ README および Wiki を参照してください（本文の link_to_page ブロックはそのまま残しています）。`,
    });
    setBlock(b, 12, { text: '導入に必要なスキルセットは？' });
    setBlock(b, 13, {
      text: `基本の HTML/CSS と Git があれば導入可能です。Astro / TypeScript の学習用途にも向きます。`,
    });
    setBlock(b, 14, {
      text: `[日本語マニュアル（Wiki）](https://github.com/otoyo/astro-notion-blog/wiki) と [Notion API ドキュメント](https://developers.notion.com/) を併読すると、セットアップからデプロイまで進めやすいです。`,
    });
    setBlock(b, 15, { text: '次のステップは？' });
    setBlock(b, 17, {
      text: `環境構築手順は [astro-notion-blogの始め方](/posts/how-to-start-astro-notion-blog-setup/)、シリーズ目次は [series-astro-notion](/posts/series-astro-notion/) を参照してください。`,
    });
    return o;
  },

  'how-to-start-astro-notion-blog-setup'(data) {
    const o = cloneExport(data);
    o.excerpt = `${FRESH}、astro-notion-blog の環境構築から初回デプロイまで。Notion DB 仕様と公式マニュアルへの導線付き。`;
    const b = o.blocks;
    setBlock(b, 0, {
      text: `${FRESH}、astro-notion-blog を初めて立ち上げる人向けに、環境セットアップから初回デプロイまでの流れを整理します。Notion データベースの列仕様もあわせて把握できる構成です。`,
    });
    setBlock(b, 1, { text: '初期デプロイの手順は？' });
    setBlock(b, 2, {
      text: `1. [日本語マニュアル（Wiki）](https://github.com/otoyo/astro-notion-blog/wiki) を開き、リポジトリの README と併せて進める`,
    });
    setBlock(b, 3, {
      text: `2. Node.js と Git を用意し、fork / clone 後に npm install → 環境変数（Notion トークン等）を .env に設定する（[Notion インテグレーション](https://developers.notion.com/docs/create-a-notion-integration)）`,
    });
    setBlock(b, 5, { text: 'Notion データベースの仕様は？' });
    setBlock(b, 6, {
      text: `デプロイ後は記事 DB の各プロパティ（Page, Published, Slug, Date, Tags, Excerpt 等）の意味を把握します。列名はコードから参照されるため変更しないでください（並べ替えは可）。`,
    });
    setBlock(b, 8, {
      text: `【システム制約】プロパティ名はプログラム内で参照されます。変更しないでください（順番の入れ替えは許容）。DB 接続は [Notion API](https://developers.notion.com/reference/post-database-query) の権限設定も確認してください。`,
    });
    setBlock(b, 9, { text: 'カスタマイズの参照先は？' });
    setBlock(b, 10, {
      text: `テーマや独自機能は [GitHub Wiki](https://github.com/otoyo/astro-notion-blog/wiki) と [Astro ドキュメント](https://docs.astro.build/) を参照してください。導入記事は [astro-notion-blog-introduction](/posts/astro-notion-blog-introduction/) から読むと流れがつながります。`,
    });
    setBlock(b, 11, {
      text: `3. 初回デプロイ後は npm run build / npm run preview で表示を確認し、GitHub Pages 等へ push して公開する（ホスティング手順は Wiki のデプロイ章）。`,
    });
    return o;
  },
};

const slugs = Object.keys(rewriters);
mkdirSync(OUT, { recursive: true });

const summaries = [];

for (const slug of slugs) {
  const exp = load(slug);
  const out = rewriters[slug](exp);
  if (out.blocks.length !== exp.blocks.length) {
    throw new Error(
      `${slug}: block count ${out.blocks.length} != ${exp.blocks.length}`
    );
  }
  for (let i = 0; i < exp.blocks.length; i++) {
    const e = exp.blocks[i];
    const n = out.blocks[i];
    if (e.notionId !== n.notionId)
      throw new Error(`${slug}[${i}]: notionId mismatch`);
    if (['image', 'divider', 'unsupported'].includes(e.kind)) {
      if (JSON.stringify(e) !== JSON.stringify(n)) {
        throw new Error(`${slug}[${i}]: verbatim block changed`);
      }
    }
    if (e.kind === 'code' && (e.text !== n.text || e.language !== n.language)) {
      throw new Error(`${slug}[${i}]: code block changed`);
    }
  }
  writeFileSync(
    join(OUT, `${slug}.json`),
    JSON.stringify(out, null, 2),
    'utf8'
  );
  const changed = out.blocks.filter((b, i) => {
    const e = exp.blocks[i];
    return (
      !['image', 'divider', 'unsupported', 'code'].includes(e.kind) &&
      e.text !== b.text
    );
  }).length;
  const issues = auditLocal(out);
  summaries.push({ slug, blocks: out.blocks.length, changed, issues });
}

writeFileSync(
  join(OUT, '_summary.json'),
  JSON.stringify(summaries, null, 2),
  'utf8'
);
for (const s of summaries) {
  console.log(`${s.slug}: ${s.issues.length ? s.issues.join(', ') : 'OK'}`);
}
