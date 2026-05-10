/**
 * 一回限りの Notion 修正（AdSense 準備・重複番号解消・連絡先）
 * 実行: node scripts/notion-content-fixes.mjs
 */
import { config } from 'dotenv';
import { Client } from '@notionhq/client';

config();

const client = new Client({ auth: process.env.NOTION_API_SECRET });

const CONTACT_URL = 'https://sssstudy.com/posts/contact/';
const X_URL = 'https://x.com/Horse_games_';

function rtText(content) {
  return [{ type: 'text', text: { content } }];
}

function rtLinked(label, url) {
  return [
    {
      type: 'text',
      text: { content: label, link: { url } },
    },
  ];
}

async function patchParagraph(blockId, plain) {
  await client.blocks.update({
    block_id: blockId,
    paragraph: { rich_text: rtText(plain) },
  });
}

async function patchHeading1(blockId, plain) {
  await client.blocks.update({
    block_id: blockId,
    heading_1: { rich_text: rtText(plain) },
  });
}

async function patchBulleted(blockId, plain) {
  await client.blocks.update({
    block_id: blockId,
    bulleted_list_item: { rich_text: rtText(plain) },
  });
}

async function deleteBlock(blockId) {
  try {
    await client.blocks.delete({ block_id: blockId });
  } catch (e) {
    const msg = String(e?.message ?? '');
    const skip =
      e?.code === 'object_not_found' ||
      (e?.code === 'validation_error' &&
        (msg.includes('archived') || msg.includes('Could not find')));
    if (!skip) throw e;
  }
}

async function main() {
  const auth = process.env.NOTION_API_SECRET;
  if (!auth) {
    console.error('Missing NOTION_API_SECRET');
    process.exit(1);
  }

  // --- TurtleBot3 タイトル（④重複解消: SSH 記事を⑤へ、以降繰り下げ） ---
  await client.pages.update({
    page_id: '3542403f-bc5c-8164-b47f-f783e481c2fa',
    properties: {
      Page: {
        title: rtText(
          '【TurtleBot3 ROS2環境構築⑤】ネットワーク設定とSSH接続 - HostPCとTurtleBot3を繋ぐ'
        ),
      },
    },
  });
  await client.pages.update({
    page_id: '3512403f-bc5c-81a1-a8a6-dceee4cde525',
    properties: {
      Page: {
        title: rtText(
          '【TurtleBot3 ROS2環境構築⑥】TurtleBot3初回起動とキーボード操縦 - bringupからteleop_keyboardまで'
        ),
      },
    },
  });
  await client.pages.update({
    page_id: '3532403f-bc5c-81d1-b94f-d02b2c49e5f7',
    properties: {
      Page: {
        title: rtText(
          '【TurtleBot3 ROS2環境構築⑦】SLAMで地図作成 - slam_toolboxとRViz2で部屋の地図を作る'
        ),
      },
    },
  });

  // SSH 記事本文の見出し・前後回参照
  await patchHeading1(
    '9fb8b59a-e4ec-4bd0-93a1-32c1fd754b59',
    '【TurtleBot3 ROS2環境構築⑤】ネットワーク設定とSSH接続 - HostPCとTurtleBot3を繋ぐ'
  );
  await patchParagraph(
    '4ce12797-61a7-4cd9-80f4-d42fe086a2b3',
    '3番目の原因: TurtleBot3のbringupがまだ起動していない（これは⑥で解説）'
  );
  await patchParagraph(
    'a37dfbc4-4baa-4215-ab4a-e91d0095f5e3',
    'これでTurtleBot3をリモート操作する準備が整いましたね！次の記事⑥ではいよいよTurtleBot3のbringupを起動してキーボードで操縦してみましょう！🤖'
  );

  // シリーズ目次ページ
  await patchParagraph(
    '3542403f-bc5c-81d1-9084-ec155073a3e8',
    '読む順：①モデル確認 → ②ホストPC → ③RPi → ④Wi-Fi とマルチマシン → ⑤SSH と接続 → ⑥実機起動 → ⑦SLAM。④と⑤はネットワーク周りを題材別に分割した記事です（Wi‑Fi／DDS 疎通が④、SSH・固定 IP が⑤）。'
  );
  await patchBulleted(
    '3542403f-bc5c-81b1-b369-cdc427f74a42',
    '⑤ SSH と接続… — リモート作業の入り口'
  );
  await patchBulleted(
    '3542403f-bc5c-8161-a1ff-f4d525bfac19',
    '⑥ bringup / teleop… — 実機の起動確認'
  );
  await patchBulleted(
    'badcf8bf-7c82-4ea2-977d-6c9c6d9ec7ea',
    '⑦ SLAM… — slam_toolbox'
  );

  // --- About: 技術ブログに寄せる・お問い合わせリンク修正 ---
  await patchParagraph(
    '2dd2403f-bc5c-81f0-8efc-f05d5847e24a',
    '「30代エンジニアの備忘録」は、組み込み・ROS2・ブログ運用などの技術学習記録を中心に運営しているブログです。'
  );
  await client.blocks.update({
    block_id: '3b6ea8b7-319c-41c3-9d1c-ec4935d57223',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'ご質問、記事の誤りのご指摘、記事へのご要望などは、',
          },
        },
        {
          type: 'text',
          text: { content: 'お問い合わせページ', link: { url: CONTACT_URL } },
        },
        {
          type: 'text',
          text: {
            content:
              'からご連絡ください。いただいたフィードバックは記事の改善に活かしています。',
          },
        },
      ],
    },
  });
  await patchBulleted(
    'e13b1a37-3230-4ff0-a677-a69a2d5e258b',
    '実務や独学で技術を続けるための、再現しやすい手順や整理のヒントを得られること'
  );

  // About から投資関連ブロックを削除
  const aboutInvestmentBlocks = [
    'd1a82a7e-5108-4055-81f2-1189418f5d2b',
    '12ba5fb6-6cd2-40a6-81db-1784ea8a8b3e',
    '453729c9-901c-4155-bb59-da3792957363',
    '3861e932-f747-4d8f-bab6-958d87ba399c',
    '8f54f873-b8e7-48ad-bc91-d742446607f0',
    'f2dec3c0-7dc0-4e17-a5b7-32e3253a836a',
    '3deaf2da-3788-42ff-b81d-90cd052ce0d1',
    'f8f5035d-f912-49a0-b756-d7077a0bba88',
    '71243a6b-3838-459a-87a9-2e0d3dfc530b',
    'e59a40bd-faba-42af-a4da-ea5ed7ec256a',
    '1f9288f5-3de9-463f-ba2c-3e9d41c3c175',
    '04c5f450-116c-43c2-a3d5-caa79b6fdce0',
  ];
  for (const id of aboutInvestmentBlocks) {
    await deleteBlock(id);
  }

  // --- Contact: X URL・投資表記 ---
  await client.blocks.update({
    block_id: '2dd2403f-bc5c-814a-971c-ce70438125c4',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'X（旧Twitter）のアカウント ',
          },
        },
        ...rtLinked('@Horse_games_', X_URL),
        {
          type: 'text',
          text: {
            content:
              ' のダイレクトメッセージを主な連絡先としています。フォロー外からのDMが届かない場合は、一度フォローいただくかリプライからご連絡ください。',
          },
        },
      ],
    },
  });
  await patchBulleted(
    '2dd2403f-bc5c-814f-8574-f6cc153b3997',
    '技術記事へのご要望'
  );

  console.log('Notion updates completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
