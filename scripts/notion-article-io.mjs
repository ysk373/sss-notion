/**
 * Notion 記事のエクスポート / リライト適用
 *   node scripts/notion-article-io.mjs export [--slug x]
 *   node scripts/notion-article-io.mjs apply --slug x --file tmp/rewrites/x.json
 */
import { config } from 'dotenv';
import { Client } from '@notionhq/client';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new Client({ auth: process.env.NOTION_API_SECRET });
const DELAY = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rtText(content) {
  const chunks = [];
  let rest = content;
  while (rest.length > 2000) {
    chunks.push({ type: 'text', text: { content: rest.slice(0, 2000) } });
    rest = rest.slice(2000);
  }
  if (rest) chunks.push({ type: 'text', text: { content: rest } });
  return chunks.length ? chunks : [{ type: 'text', text: { content: '' } }];
}

function rtFromMarkdownLine(line) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const parts = [];
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      parts.push({
        type: 'text',
        text: { content: line.slice(last, m.index) },
      });
    }
    parts.push({
      type: 'text',
      text: { content: m[1], link: { url: m[2] } },
    });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    parts.push({ type: 'text', text: { content: line.slice(last) } });
  }
  return parts.length ? parts : rtText(line);
}

function richPlain(rich = []) {
  return rich.map((t) => t.plain_text || '').join('');
}

async function listChildren(blockId) {
  const blocks = [];
  let cursor;
  do {
    await sleep(DELAY);
    const res = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const b of res.results) {
      blocks.push(b);
      if (
        b.has_children &&
        !['child_page', 'child_database'].includes(b.type)
      ) {
        const nested = await listChildren(b.id);
        blocks.push(...nested);
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function listTopLevel(pageId) {
  const blocks = [];
  let cursor;
  do {
    await sleep(DELAY);
    const res = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

function blockToExport(b) {
  const type = b.type;
  const base = { notionType: type, notionId: b.id };
  if (type === 'paragraph' && b.paragraph) {
    return {
      ...base,
      kind: 'paragraph',
      text: richPlain(b.paragraph.rich_text),
    };
  }
  if (type === 'heading_1' && b.heading_1) {
    return {
      ...base,
      kind: 'heading_1',
      text: richPlain(b.heading_1.rich_text),
    };
  }
  if (type === 'heading_2' && b.heading_2) {
    return {
      ...base,
      kind: 'heading_2',
      text: richPlain(b.heading_2.rich_text),
    };
  }
  if (type === 'heading_3' && b.heading_3) {
    return {
      ...base,
      kind: 'heading_3',
      text: richPlain(b.heading_3.rich_text),
    };
  }
  if (type === 'bulleted_list_item' && b.bulleted_list_item) {
    return {
      ...base,
      kind: 'bulleted_list_item',
      text: richPlain(b.bulleted_list_item.rich_text),
    };
  }
  if (type === 'numbered_list_item' && b.numbered_list_item) {
    return {
      ...base,
      kind: 'numbered_list_item',
      text: richPlain(b.numbered_list_item.rich_text),
    };
  }
  if (type === 'code' && b.code) {
    return {
      ...base,
      kind: 'code',
      text: richPlain(b.code.rich_text),
      language: b.code.language || 'plain text',
    };
  }
  if (type === 'quote' && b.quote) {
    return { ...base, kind: 'quote', text: richPlain(b.quote.rich_text) };
  }
  if (type === 'image' && b.image) {
    const url =
      b.image.type === 'external' ? b.image.external?.url : b.image.file?.url;
    return {
      ...base,
      kind: 'image',
      url: url || '',
      caption: richPlain(b.image.caption),
    };
  }
  if (type === 'divider') {
    return { ...base, kind: 'divider' };
  }
  if (type === 'callout' && b.callout) {
    return { ...base, kind: 'callout', text: richPlain(b.callout.rich_text) };
  }
  return { ...base, kind: 'unsupported', text: `[${type}]` };
}

function exportBlockToNotion(b) {
  if (b.kind === 'paragraph') {
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: rtFromMarkdownLine(b.text) },
    };
  }
  if (b.kind === 'heading_1') {
    return {
      object: 'block',
      type: 'heading_1',
      heading_1: { rich_text: rtText(b.text) },
    };
  }
  if (b.kind === 'heading_2') {
    return {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: rtText(b.text) },
    };
  }
  if (b.kind === 'heading_3') {
    return {
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: rtText(b.text) },
    };
  }
  if (b.kind === 'bulleted_list_item') {
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: rtFromMarkdownLine(b.text) },
    };
  }
  if (b.kind === 'numbered_list_item') {
    return {
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: { rich_text: rtFromMarkdownLine(b.text) },
    };
  }
  if (b.kind === 'code') {
    return {
      object: 'block',
      type: 'code',
      code: {
        rich_text: rtText(b.text),
        language: b.language || 'plain text',
      },
    };
  }
  if (b.kind === 'quote') {
    return {
      object: 'block',
      type: 'quote',
      quote: { rich_text: rtFromMarkdownLine(b.text) },
    };
  }
  if (b.kind === 'divider') {
    return { object: 'block', type: 'divider', divider: {} };
  }
  if (b.kind === 'image' && b.url) {
    return {
      object: 'block',
      type: 'image',
      image: { type: 'external', external: { url: b.url } },
    };
  }
  if (b.kind === 'callout') {
    return {
      object: 'block',
      type: 'callout',
      callout: { rich_text: rtFromMarkdownLine(b.text), icon: { emoji: '💡' } },
    };
  }
  return null;
}

async function getPageMeta(pageId) {
  const page = await client.pages.retrieve({ page_id: pageId });
  const p = page.properties;
  return {
    pageId,
    title: p.Page?.title?.[0]?.plain_text ?? '',
    slug: p.Slug?.rich_text?.[0]?.plain_text ?? '',
    excerpt: (p.Excerpt?.rich_text || []).map((t) => t.plain_text).join(''),
    tags: (p.Tags?.multi_select || []).map((t) => t.name),
  };
}

async function exportArticle(pageId, slugHint) {
  const meta = await getPageMeta(pageId);
  const slug = slugHint || meta.slug;
  const top = await listTopLevel(pageId);
  const blocks = top.map(blockToExport);
  const preserveImages = blocks.filter((b) => b.kind === 'image');
  const body = blocks.filter((b) => b.kind !== 'image' || !b.url);

  const out = {
    pageId,
    slug,
    title: meta.title,
    excerpt: meta.excerpt,
    tags: meta.tags,
    preserveImages,
    blocks: body,
  };
  const dir = join(__dirname, '../tmp/articles-export');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${slug}.json`);
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');
  return path;
}

const KEEP_KINDS = new Set(['image', 'divider', 'unsupported', 'keep']);

async function patchBlock(blockId, b, notionType) {
  const type = notionType || b.notionType || b.kind;
  const text = b.text ?? '';

  if (type === 'paragraph') {
    await client.blocks.update({
      block_id: blockId,
      paragraph: { rich_text: rtFromMarkdownLine(text) },
    });
  } else if (type === 'heading_1') {
    await client.blocks.update({
      block_id: blockId,
      heading_1: { rich_text: rtText(text) },
    });
  } else if (type === 'heading_2') {
    await client.blocks.update({
      block_id: blockId,
      heading_2: { rich_text: rtText(text) },
    });
  } else if (type === 'heading_3') {
    await client.blocks.update({
      block_id: blockId,
      heading_3: { rich_text: rtText(text) },
    });
  } else if (type === 'bulleted_list_item') {
    await client.blocks.update({
      block_id: blockId,
      bulleted_list_item: { rich_text: rtFromMarkdownLine(text) },
    });
  } else if (type === 'numbered_list_item') {
    await client.blocks.update({
      block_id: blockId,
      numbered_list_item: { rich_text: rtFromMarkdownLine(text) },
    });
  } else if (type === 'code') {
    await client.blocks.update({
      block_id: blockId,
      code: {
        rich_text: rtText(text),
        language: b.language || 'plain text',
      },
    });
  } else if (type === 'quote') {
    await client.blocks.update({
      block_id: blockId,
      quote: { rich_text: rtFromMarkdownLine(text) },
    });
  } else if (type === 'callout') {
    await client.blocks.update({
      block_id: blockId,
      callout: { rich_text: rtFromMarkdownLine(text), icon: { emoji: '💡' } },
    });
  }
}

async function applyRewrite(slug, filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const pageId = data.pageId;
  if (!pageId) throw new Error('pageId missing in rewrite file');

  const today = new Date().toISOString().slice(0, 10);

  await client.pages.update({
    page_id: pageId,
    properties: {
      ...(data.excerpt ? { Excerpt: { rich_text: rtText(data.excerpt) } } : {}),
      LastUpdated: { date: { start: today } },
    },
  });

  const top = await listTopLevel(pageId);
  const blocks = data.blocks || [];
  const byId = new Map(
    blocks.filter((b) => b.notionId).map((b) => [b.notionId, b])
  );

  if (byId.size > 0) {
    for (const b of top) {
      const neu = byId.get(b.id);
      if (!neu || KEEP_KINDS.has(neu.kind)) continue;
      await sleep(DELAY);
      await patchBlock(b.id, neu, b.type);
    }
  } else if (blocks.length === top.length) {
    for (let i = 0; i < top.length; i++) {
      const neu = blocks[i];
      if (KEEP_KINDS.has(neu.kind)) continue;
      await sleep(DELAY);
      await patchBlock(top[i].id, neu, top[i].type);
    }
  } else {
    throw new Error(
      `${slug}: cannot match blocks (rewrite=${blocks.length}, notion=${top.length})`
    );
  }

  console.log(`Applied rewrite: ${slug}`);
}

async function applyAllRewrites() {
  const dir = join(__dirname, '../tmp/rewrites');
  if (!existsSync(dir)) {
    console.error('No tmp/rewrites directory');
    process.exit(1);
  }
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.json') && !f.startsWith('_')
  );
  for (const f of files) {
    const slug = f.replace(/\.json$/, '');
    await applyRewrite(slug, join(dir, f));
  }
}

async function exportAllFromAudit() {
  const auditPath = join(__dirname, '../tmp/geo-audit.json');
  if (!existsSync(auditPath)) {
    console.error('Run npm run geo:audit first');
    process.exit(1);
  }
  const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  for (const p of audit.posts) {
    const path = await exportArticle(p.pageId, p.slug);
    console.log(`Exported ${p.slug} -> ${path}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'export-all') {
    await exportAllFromAudit();
    return;
  }
  if (cmd === 'export') {
    let slug = '';
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--slug') slug = rest[++i];
    }
    const audit = JSON.parse(
      readFileSync(join(__dirname, '../tmp/geo-audit.json'), 'utf8')
    );
    const post = audit.posts.find((p) => p.slug === slug);
    if (!post) throw new Error(`slug not in audit: ${slug}`);
    await exportArticle(post.pageId, slug);
    return;
  }
  if (cmd === 'apply') {
    let slug = '';
    let file = '';
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--slug') slug = rest[++i];
      if (rest[i] === '--file') file = rest[++i];
    }
    if (!slug || !file) throw new Error('apply needs --slug and --file');
    await applyRewrite(slug, file);
    return;
  }
  if (cmd === 'apply-all') {
    await applyAllRewrites();
    return;
  }
  console.error(
    'Usage: export-all | export --slug x | apply --slug x --file path | apply-all'
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
