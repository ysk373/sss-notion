/**
 * fix-mojibake.cjs
 * 前回のスクリプト実行でPowerShellエンコーディング問題により
 * Notionに追記された日本語テキストが文字化け（????）している箇所を修正する。
 *
 * 対象: 末尾に追加した「検証環境と失敗しやすい点」「投資記事の前提と注意点」セクション
 */

const { setTimeout } = require('timers/promises');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_SECRET });
const DELAY_MS = 350;

const sleep = (ms) => setTimeout(ms);

// ページIDとカテゴリのマッピング
const TECH_PAGES = [
  { id: '3352403f-bc5c-8186-a1e8-c4224c5f3152', slug: 'ros2-introduction' },
  { id: '3352403f-bc5c-8195-b67b-c8f7266dd318', slug: 'ros2-installation' },
  {
    id: '3352403f-bc5c-816a-ba33-ef8d3f6b9ebf',
    slug: 'ros2-publisher-subscriber',
  },
  {
    id: '3512403f-bc5c-8113-8950-f88b87f14818',
    slug: 'turtlebot3-ros2-overview',
  },
  {
    id: '3512403f-bc5c-811a-8937-e5e332d4bccd',
    slug: 'turtlebot3-ros2-host-pc-setup',
  },
];

const INVESTMENT_PAGES = [
  {
    id: '3532403f-bc5c-81f0-954a-d3b8653d503e',
    slug: 'dca-drawdown-python-nisa',
  },
  {
    id: '3532403f-bc5c-814f-844f-d199a1c69eab',
    slug: 'nisa-monthly-amount-from-budget',
  },
  {
    id: '3532403f-bc5c-81fc-8fd3-ce697ebfac02',
    slug: 'emergency-fund-before-nisa',
  },
  {
    id: '3532403f-bc5c-818f-a7b5-e85ee134a8df',
    slug: 'all-country-vs-sp500-nisa',
  },
  {
    id: '3532403f-bc5c-81d6-a5e5-e32dee831aff',
    slug: 'household-budget-50k-to-investment',
  },
];

// 技術記事用セクション
const TECH_SECTION_BLOCKS = [
  {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        { type: 'text', text: { content: '検証環境と失敗しやすい点' } },
      ],
    },
  },
  {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'この記事の内容は以下の環境で確認しています。実際の環境によっては、コマンドの出力や挙動が異なる場合があります。',
          },
        },
      ],
    },
  },
  {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        { type: 'text', text: { content: 'Ubuntu 22.04 LTS（実機）' } },
      ],
    },
  },
  {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: 'ROS2 Humble Hawksbill' } }],
    },
  },
  {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        {
          type: 'text',
          text: { content: 'TurtleBot3 Burger（Raspberry Pi 4搭載）' },
        },
      ],
    },
  },
  {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'つまずきやすいポイントや環境依存の問題については、記事内で随時補足しています。',
          },
        },
      ],
    },
  },
];

// 投資記事用セクション
const INVESTMENT_SECTION_BLOCKS = [
  {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        { type: 'text', text: { content: '投資記事の前提と注意点' } },
      ],
    },
  },
  {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              'この記事は個人の学習記録です。記事内のシミュレーション・数値は一般的な理解を助けるための例示であり、特定の金融商品や投資戦略を推奨するものではありません。',
          },
        },
      ],
    },
  },
  {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              '投資にはリスクが伴います。実際の投資判断は、ご自身の責任のもと、必要に応じて専門家にご相談ください。',
          },
        },
      ],
    },
  },
  {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: [
        {
          type: 'text',
          text: {
            content:
              '当サイトの投資関連記事は、金融商品取引業者等の登録を受けていない個人が作成した情報です。投資の最終判断はご自身でお願いします。',
          },
        },
      ],
    },
  },
];

/**
 * ブロックのプレーンテキストを取得する
 */
function getPlainText(block) {
  const type = block.type;
  if (!block[type]) return '';
  const richTextArr = block[type].rich_text || [];
  return richTextArr.map((rt) => rt.plain_text || '').join('');
}

/**
 * 文字化けブロックかどうか判定する
 * "?" が連続している場合は文字化けと判断
 */
function isMojibake(block) {
  const text = getPlainText(block);
  if (!text) return false;
  // テキストの50%以上が"?"なら文字化けと判断
  const qCount = (text.match(/\?/g) || []).length;
  return text.length > 0 && qCount / text.length >= 0.5;
}

/**
 * ページの全ブロックを取得する
 */
async function getAllBlocks(pageId) {
  const blocks = [];
  let cursor = undefined;

  while (true) {
    await sleep(DELAY_MS);
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return blocks;
}

/**
 * ブロックを削除する
 */
async function deleteBlock(blockId) {
  await sleep(DELAY_MS);
  await notion.blocks.delete({ block_id: blockId });
}

/**
 * ブロックを末尾に追記する
 */
async function appendBlocks(pageId, blocks) {
  await sleep(DELAY_MS);
  await notion.blocks.children.append({
    block_id: pageId,
    children: blocks,
  });
}

/**
 * 1ページの文字化けを修正する
 */
async function fixPage(pageId, slug, appendBlocks_) {
  console.log(`\n--- ${slug} (${pageId}) ---`);

  const allBlocks = await getAllBlocks(pageId);

  // 末尾から文字化けブロックを探す
  const mojibakeBlockIds = [];
  for (let i = allBlocks.length - 1; i >= 0; i--) {
    const block = allBlocks[i];
    if (isMojibake(block)) {
      mojibakeBlockIds.unshift(block.id);
    } else {
      // 文字化けが途切れたら終了
      // ただし heading_2 が文字化けしている場合はそこまで含める
      if (block.type === 'heading_2' && isMojibake(block)) {
        mojibakeBlockIds.unshift(block.id);
      }
      break;
    }
  }

  // 末尾から検索して、文字化け heading_2 を起点にそれ以降を全て削除対象とする
  // より確実な方法: 末尾から連続する文字化けブロックのインデックスを特定
  const mojibakeStartIdx = findMojibakeStart(allBlocks);
  const toDelete = allBlocks.slice(mojibakeStartIdx);

  if (toDelete.length === 0) {
    console.log('  文字化けブロックなし。スキップします。');
    return;
  }

  console.log(`  文字化けブロック ${toDelete.length} 件を削除します。`);
  for (const block of toDelete) {
    const text = getPlainText(block);
    console.log(`  DELETE: [${block.type}] "${text.substring(0, 40)}"`);
    await deleteBlock(block.id);
  }

  console.log(`  正しいコンテンツを追記します。`);
  await appendBlocks(pageId, appendBlocks_);
  console.log(`  完了: ${slug}`);
}

/**
 * 末尾の文字化けセクション開始インデックスを探す
 * heading_2 で文字化けしているブロックを起点にする
 */
function findMojibakeStart(blocks) {
  // 末尾から遡って文字化けブロックを探す
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (!isMojibake(block)) {
      // このブロックは正常 → i+1 が文字化け開始
      return i + 1;
    }
  }
  return 0;
}

async function main() {
  console.log('=== Notion 文字化け修正スクリプト ===');

  console.log('\n【技術記事】検証環境セクションを修正');
  for (const page of TECH_PAGES) {
    await fixPage(page.id, page.slug, TECH_SECTION_BLOCKS);
  }

  console.log('\n【投資記事】免責セクションを修正');
  for (const page of INVESTMENT_PAGES) {
    await fixPage(page.id, page.slug, INVESTMENT_SECTION_BLOCKS);
  }

  console.log('\n=== 全ページの修正完了 ===');
}

main().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
