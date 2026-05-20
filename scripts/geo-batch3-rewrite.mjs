/**
 * バッチ3: articles-export → rewrites（GEO issues 解消）
 *   node scripts/geo-batch3-rewrite.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const EXPORT = join(ROOT, 'tmp/articles-export')
const OUT = join(ROOT, 'tmp/rewrites')

const FRESH = '2026年5月時点'
const QUERY_H2 = /[？?]|とは|手順|方法|やり方|違い|比較|上限|インストール/
const FRESHNESS = /20\d{2}年\d{1,2}月/
const EXT_LINK = /\[([^\]]+)\]\(https?:\/\/[^)]+\)/

function deepClone(o) {
  return JSON.parse(JSON.stringify(o))
}

function patchBlock(blocks, notionId, patch) {
  const i = blocks.findIndex((b) => b.notionId === notionId)
  if (i < 0) throw new Error(`block not found: ${notionId}`)
  blocks[i] = { ...blocks[i], ...patch }
}

function patchH2(blocks, oldText, newText) {
  const b = blocks.find((x) => x.kind === 'heading_2' && x.text === oldText)
  if (!b) throw new Error(`h2 not found: ${oldText}`)
  b.text = newText
}

function prependFresh(text) {
  if (FRESHNESS.test(text)) return text
  return `（${FRESH}）${text}`
}

function ensureLink(text, label, url) {
  if (text.includes(url)) return text
  return `${text} 参考：[${label}](${url})`
}

function auditLocal(data) {
  const issues = []
  const h2s = data.blocks.filter((b) => b.kind === 'heading_2').map((b) => b.text)
  const bodyText = data.blocks.map((b) => b.text || '').join('\n')
  const intro = data.blocks
    .filter((b) => ['paragraph', 'heading_2'].includes(b.kind))
    .slice(0, 5)
    .map((b) => b.text || '')
    .join('')
  const freshnessText = `${data.excerpt}\n${intro}`

  if (!h2s.some((t) => QUERY_H2.test(t))) {
    issues.push('h2_not_query_like')
  }
  if (!FRESHNESS.test(freshnessText)) {
    issues.push('no_freshness_marker')
  }
  if (!EXT_LINK.test(bodyText) && data.blocks.filter((b) => b.kind === 'paragraph').length >= 5) {
    issues.push('no_external_link')
  }
  const isHowTo =
    data.tags?.includes('How-to') ||
    /手順|インストール|構築|設定/.test(data.title)
  if (isHowTo && !data.blocks.some((b) => b.kind === 'numbered_list_item')) {
    issues.push('howto_no_numbered_list')
  }
  return issues
}

const SLUGS = [
  'turtlebot3-ros2-slam-toolbox-mapping',
  'compiler-and-linker-basics',
  'object-file-explained',
  'static-vs-dynamic-linking',
  'makefile-basics',
  'memory-map-explained',
  'digital-filter-design',
  'fft-basics-implementation',
  'ica-iva-noise-separation',
]

function rewriteTurtlebot(data) {
  data.excerpt = `（${FRESH}）TurtleBot3実機で slam_toolbox を起動し、RViz2 と teleop で部屋の地図を作成する手順。地図保存・品質確認・トラブル対処まで、Nav2 前の SLAM を一通り押さえられます。`
  const b = data.blocks
  b[0].text = prependFresh(
    '前回は TurtleBot3 を bringup し、キーボード操縦と RViz2 で LiDAR 可視化まで完了しました。本記事は TurtleBot3 × ROS 2 Humble シリーズの第7回で、SLAM 地図作成がゴールです。'
  )
  patchH2(b, 'この記事でわかること', 'この記事で何がわかる？')
  patchH2(b, 'SLAMで何が起きているのか', 'SLAMとは何が起きている？')
  patchH2(b, 'Step 1: 事前チェック', 'Step 1：SLAM 開始前の確認手順は？')
  patchH2(b, 'Step 2: TurtleBot3をbringupする', 'Step 2：TurtleBot3 を bringup する方法は？')
  patchH2(b, 'Step 3: slam_toolboxを起動する', 'Step 3：slam_toolbox を起動する方法は？')
  patchH2(b, 'Step 4: RViz2で地図を表示する', 'Step 4：RViz2 で地図を表示する方法は？')
  patchH2(b, 'Step 5: teleopでゆっくり地図を作る', 'Step 5：teleop で地図を作るコツは？')
  patchH2(b, 'Step 6: 地図の品質を確認する', 'Step 6：地図の品質を確認する方法は？')
  patchH2(b, 'Step 7: 地図を保存する', 'Step 7：地図を保存する手順は？')
  patchH2(b, 'Step 8: 保存した地図を軽く確認する', 'Step 8：保存した地図を確認する方法は？')
  patchH2(b, 'よくあるトラブル', 'よくあるトラブルと対処方法は？')
  patchH2(b, '今回使ったコマンドまとめ', '今回使ったコマンドのまとめは？')
  patchH2(b, 'まとめ', 'まとめ：次に Nav2 へ進む前に押さえることは？')

  // この記事でわかること の5項目を番号リスト化
  for (const id of [
    'bbbbb916-0927-442f-b359-ba2baa27d459',
    '9264a69a-cfc5-4b1d-8f87-9e34a706dca7',
    '2d8b58b2-8652-4050-bd3f-40e729605a6b',
    '350a6f31-691c-4dbb-a3b4-e673101a566c',
    '1d1dd8ef-ccdb-40a0-bc6d-bfd06d1bb070',
  ]) {
    const blk = b.find((x) => x.notionId === id)
    if (blk) {
      blk.kind = 'numbered_list_item'
      blk.notionType = 'numbered_list_item'
    }
  }

  // SLAM 説明段落に外部リンク
  const slamPara = b.find(
    (x) =>
      x.kind === 'paragraph' &&
      x.text?.includes('SLAMは「ロボットが自分の位置を推定しながら')
  )
  if (slamPara) {
    slamPara.text = ensureLink(
      slamPara.text,
      'slam_toolbox（ROS 2）',
      'https://github.com/SteveMacenski/slam_toolbox'
    )
  }
  const callout = b.find((x) => x.notionId === '80641a2b-5ca0-4a1a-8916-b1e9b0aebb95')
  if (callout) {
    callout.text = ensureLink(
      callout.text,
      'ROS 2 Humble ドキュメント',
      'https://docs.ros.org/en/humble/'
    )
  }
}

function rewriteCompiler(data) {
  data.excerpt = `（${FRESH}）C/C++ ソースが実行ファイルになるまでの4段階（プリプロセス→コンパイル→アセンブル→リンク）を、gcc の中間成果物確認例つきで整理します。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  const b = data.blocks
  patchH2(b, 'ビルドプロセスの全体像', 'ビルドプロセスの全体像とは？')
  patchH2(b, 'Step 1：プリプロセス（テキスト置換）', 'Step 1：プリプロセス（テキスト置換）とは？')
  patchH2(b, 'Step 2：コンパイル（C言語→アセンブリ）', 'Step 2：コンパイルで何が起きる？')
  patchH2(b, 'Step 3：アセンブル（アセンブリ→機械語）', 'Step 3：アセンブルで .o ができる理由は？')
  patchH2(b, 'Step 4：リンク（オブジェクトファイルの結合）', 'Step 4：リンクで undefined reference が出るのはなぜ？')
  patchH2(b, '分業アーキテクチャの利点', '分業アーキテクチャの利点は？')
  b[2].text = ensureLink(
    b[2].text,
    'GCC Internals（公式）',
    'https://gcc.gnu.org/onlinedocs/gccint/'
  )
}

function rewriteObjectFile(data) {
  data.excerpt = `（${FRESH}）.o ファイルのセクション・シンボル・再配置情報を整理。nm / objdump / readelf でリンク段の切り分けに使える見取り図として読めます。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  const b = data.blocks
  patchH2(b, 'オブジェクトファイルの位置づけ', 'オブジェクトファイルの位置づけとは？')
  patchH2(b, 'セクション構造', 'セクション構造（.text / .data / .bss）とは？')
  patchH2(b, 'シンボルテーブル', 'シンボルテーブルは何のためにある？')
  patchH2(b, '再配置情報（Relocation）', '再配置情報（Relocation）とは？')
  patchH2(b, 'ELFフォーマットの概要（Linux でよく見る場合）', 'ELF フォーマットの概要とは？')
  patchH2(b, 'まとめ', 'まとめ：.o を読むときの確認手順は？')
  const elfPara = b.find((x) => x.notionId === '3172403f-bc5c-81e0-a590-d342d8cc31c8')
  if (elfPara) {
    elfPara.text = ensureLink(
      elfPara.text,
      'ELF 仕様（gABI）',
      'https://refspecs.linuxfoundation.org/elf/elf.pdf'
    )
  }
}

function rewriteStaticDynamic(data) {
  data.excerpt = `（${FRESH}）静的リンクと動的リンクの違いを、配布・更新・メモリ共有・組み込み Linux の前提差から整理。ライブラリ選択の判断材料として読めます。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  patchH2(data.blocks, '静的リンクの仕組み', '静的リンクの仕組みとは？')
  patchH2(data.blocks, '動的リンクの仕組み', '動的リンクの仕組みとは？')
  patchH2(data.blocks, '組み込みシステムでの選択', '組み込みシステムではどちらを選ぶ？')
  patchH2(data.blocks, '依存ライブラリの確認方法', '依存ライブラリの確認方法は？')
  patchH2(data.blocks, 'まとめ', 'まとめ：静的と動的の選び方の違いは？')
  data.blocks[1].text = ensureLink(
    data.blocks[1].text,
    'ld.so の動作（man ld.so）',
    'https://man7.org/linux/man-pages/man8/ld.so.8.html'
  )
}

function rewriteMakefile(data) {
  data.excerpt = `（${FRESH}）Makefile の基本構文、変数・パターンルール・.PHONY から小さな C プロジェクト用テンプレまで。GNU Make による差分ビルドの足がかりとして読めます。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  patchH2(data.blocks, '基本構文', 'Makefile の基本構文とは？')
  patchH2(data.blocks, '変数の活用', 'Makefile で変数を使う方法は？')
  patchH2(data.blocks, '自動変数', '自動変数（$@ $< $^）とは？')
  patchH2(data.blocks, 'パターンルール', 'パターンルールの書き方は？')
  patchH2(data.blocks, '.PHONYターゲット', '.PHONY ターゲットとは？')
  patchH2(data.blocks, '実践的なMakefileテンプレート', '実践的な Makefile テンプレート例は？')
  patchH2(data.blocks, 'まとめ', 'まとめ：Make を使うときの要点は？')
  data.blocks[1].text = ensureLink(
    data.blocks[1].text,
    'GNU Make マニュアル',
    'https://www.gnu.org/software/make/manual/make.html'
  )
}

function rewriteMemoryMap(data) {
  data.excerpt = `（${FRESH}）Flash / RAM への .text〜.bss 配置、リンカスクリプト・スタートアップ・.map の役割を整理。Cortex-M 系を例に BSP の .ld を読むためのガイドです。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  const b = data.blocks
  patchH2(b, 'メモリマップの全体像', 'メモリマップの全体像とは？')
  patchH2(b, 'リンカスクリプトによるメモリ制御', 'リンカスクリプトでメモリを制御する方法は？')
  patchH2(b, 'スタートアップコードとの連携', 'スタートアップコードとリンカの連携とは？')
  patchH2(b, '.map ファイル（サイズと配置のログ）', '.map ファイルは何のために使う？')
  patchH2(b, 'まとめ', 'まとめ：メモリマップを読むときの確認手順は？')
  b[1].text = ensureLink(
    b[1].text,
    'GNU ld リンカスクリプト',
    'https://sourceware.org/binutils/docs/ld/Scripts.html'
  )
}

function rewriteDigitalFilter(data) {
  data.excerpt = `（${FRESH}）FIR と IIR の違い、SciPy による設計・適用例、lfilter と filtfilt の使い分けまで。デジタルフィルタ入門の要点を押さえられます。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  patchH2(data.blocks, 'Pythonによるフィルタ設計', 'Python でフィルタを設計する方法は？')
  patchH2(data.blocks, 'フィルタの適用', '設計したフィルタを信号に適用する方法は？')
  patchH2(data.blocks, 'リアルタイム処理への応用', 'リアルタイム処理へ応用する方法は？')
  patchH2(data.blocks, '設計時の注意点', 'フィルタ設計時の注意点は？')
  patchH2(data.blocks, 'まとめ', 'まとめ：FIR と IIR の選び方の違いは？')
  const scipyPara = data.blocks.find((x) => x.notionId === '3172403f-bc5c-81e9-b935-d37bfaa1d745')
  if (scipyPara) {
    scipyPara.text = ensureLink(
      scipyPara.text,
      'SciPy signal モジュール',
      'https://docs.scipy.org/doc/scipy/reference/signal.html'
    )
  }
}

function rewriteFft(data) {
  data.excerpt = `（${FRESH}）DFT と FFT の計算量の違い、窓関数の必要性、NumPy による振幅スペクトル表示まで。FFT 入門の実装要点を押さえられます。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  patchH2(data.blocks, 'DFT（離散フーリエ変換）', 'DFT（離散フーリエ変換）とは？')
  patchH2(data.blocks, 'FFT（高速フーリエ変換）', 'FFT（高速フーリエ変換）とは？')
  patchH2(data.blocks, '窓関数の役割', '窓関数の役割とは？')
  patchH2(data.blocks, 'PythonによるFFT実装', 'Python で FFT を実装する方法は？')
  patchH2(data.blocks, '実用上の注意点', 'FFT を使うときの注意点は？')
  patchH2(data.blocks, 'まとめ', 'まとめ：DFT と FFT の使い分けは？')
  data.blocks[0].text = ensureLink(
    data.blocks[0].text,
    'NumPy fft リファレンス',
    'https://numpy.org/doc/stable/reference/routines.fft.html'
  )
}

function rewriteIca(data) {
  data.excerpt = `（${FRESH}）ICA と周波数ビン ICA のパーミュテーション問題、IVA が追加する制約を整理。音源分離入門として前提条件と実装のつまずきが分かります。`
  data.blocks[0].text = prependFresh(data.blocks[0].text)
  patchH2(data.blocks, '読み終えたあとに持ち帰るポイントは？', '読み終えたあとに持ち帰るポイントは？（復習）')
  const icaPara = data.blocks.find((x) => x.notionId === '3172403f-bc5c-81d8-b540-f4a495596433')
  if (icaPara) {
    icaPara.text = ensureLink(
      icaPara.text,
      'scikit-learn FastICA',
      'https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.FastICA.html'
    )
  }
  const callout = data.blocks.find((x) => x.notionId === '0927cb1d-632b-47b9-9e7a-b3f8b50eebfa')
  if (callout) {
    callout.text = ensureLink(
      callout.text,
      'pyroomacoustics',
      'https://github.com/LCAV/pyroomacoustics'
    )
  }
}

const REWRITERS = {
  'turtlebot3-ros2-slam-toolbox-mapping': rewriteTurtlebot,
  'compiler-and-linker-basics': rewriteCompiler,
  'object-file-explained': rewriteObjectFile,
  'static-vs-dynamic-linking': rewriteStaticDynamic,
  'makefile-basics': rewriteMakefile,
  'memory-map-explained': rewriteMemoryMap,
  'digital-filter-design': rewriteDigitalFilter,
  'fft-basics-implementation': rewriteFft,
  'ica-iva-noise-separation': rewriteIca,
}

mkdirSync(OUT, { recursive: true })

const summary = []

for (const slug of SLUGS) {
  const src = JSON.parse(readFileSync(join(EXPORT, `${slug}.json`), 'utf8'))
  const origLen = src.blocks.length
  const data = deepClone(src)
  REWRITERS[slug](data)
  if (data.blocks.length !== origLen) {
    throw new Error(`${slug}: block count changed ${origLen} → ${data.blocks.length}`)
  }
  const issues = auditLocal(data)
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(data, null, 2), 'utf8')
  summary.push({ slug, blocks: data.blocks.length, issues })
  console.log(`${slug}: ${issues.length ? issues.join(', ') : 'OK'}`)
}

writeFileSync(join(OUT, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8')
