/**
 * Migration Script: sssstudy (Markdown) -> sss-notion (Notion)
 * 
 * Usage: node scripts/migrate_to_notion.cjs
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const { uploadToR2 } = require('./r2-upload.cjs');
require('dotenv').config();

// Configuration
const SOURCE_DIR = 'c:/dev/hp/sssstudy/content'; // Absolute path to source content
const PUBLIC_DIR = 'c:/dev/hp/sssstudy/public';   // Absolute path to source public dir
const DATABASE_ID = process.env.DATABASE_ID || '2d82403f-bc5c-819f-a7f6-f1caee97d49f';
const DRY_RUN = false; // Set to true to test parsing without writing to Notion

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_SECRET });

// Utils
function parseFrontmatter(content) {
    // Normalize line endings to LF for consistent parsing
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const match = normalizedContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: content };

    const frontmatterRaw = match[1];
    const body = match[2];

    const metadata = {};
    for (const line of frontmatterRaw.split('\n')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join(':').trim();

            // Handle lists (e.g. tags: [a, b])
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
            } else {
                value = value.replace(/^['"]|['"]$/g, '');
            }
            metadata[key] = value;
        }
    }
    return { metadata, body };
}

async function handleImage(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    // Resolve local path
    // sssstudy images are usually like /images/foo.png which maps to public/images/foo.png
    const localPath = path.join(PUBLIC_DIR, imagePath.replace(/^\//, ''));

    if (fs.existsSync(localPath)) {
        console.log(`Uploading image: ${localPath}`);
        const result = await uploadToR2(localPath, 'migration/' + path.basename(localPath));
        if (result.success) {
            return result.url;
        } else {
            console.error(`Failed to upload image: ${result.error}`);
            return null;
        }
    } else {
        console.warn(`Image not found: ${localPath}`);
        return null;
    }
}

function markdownToBlocks(markdown) {
    const blocks = [];
    const lines = markdown.split('\n');
    let currentCodeBlock = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code Blocks
        if (line.trim().startsWith('```')) {
            if (currentCodeBlock) {
                // End code block
                blocks.push({
                    object: 'block',
                    type: 'code',
                    code: {
                        rich_text: [{ type: 'text', text: { content: currentCodeBlock.content } }],
                        language: currentCodeBlock.language || 'plain text'
                    }
                });
                currentCodeBlock = null;
            } else {
                // Start code block
                const language = line.trim().slice(3).trim();
                currentCodeBlock = { content: '', language };
            }
            continue;
        }
        if (currentCodeBlock) {
            currentCodeBlock.content += line + '\n';
            continue;
        }

        // Headings
        if (line.startsWith('# ')) {
            blocks.push({
                object: 'block',
                type: 'heading_1',
                heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] }
            });
        } else if (line.startsWith('## ')) {
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] }
            });
        } else if (line.startsWith('### ')) {
            blocks.push({
                object: 'block',
                type: 'heading_3',
                heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4) } }] }
            });
        }
        // Images: ![alt](src)
        else if (line.match(/!\[.*?\]\(.*?\)/)) {
            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
            const alt = match[1];
            const src = match[2];

            // We will handle uploading in the main loop if possible, but for blocks we need async processing.
            // Since we can't easily async inside this sync loop without refactoring, we'll mark it for post-processing or handle it crudely.
            // Actually, we'll return a special object to be processed later
            blocks.push({
                _isImage: true,
                alt,
                src
            });
        }
        // Lists
        else if (line.trim().startsWith('- ')) {
            blocks.push({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.trim().slice(2) } }] }
            });
        }
        // Paragraphs (ignore empty lines)
        else if (line.trim().length > 0) {
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: line } }] }
            });
        }
    }
    return blocks;
}

async function migrateFile(filePath, type) {
    console.log(`Processing: ${filePath}`);
    const contentRaw = fs.readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(contentRaw);

    // Filter out unpublished if needed, but we migrate all requested
    // Mapping
    const title = metadata.title || path.basename(filePath, '.md');
    const slug = metadata.slug || path.basename(filePath, '.md');
    const description = metadata.description || '';
    const dateStr = metadata.published_date || metadata.date || new Date().toISOString().split('T')[0];
    const tags = Array.isArray(metadata.tags) ? metadata.tags : [];

    // Upload Cover Image
    let coverUrl = null;
    if (metadata.image) {
        coverUrl = await handleImage(metadata.image);
    }

    console.log(`  Title: ${title}`);
    console.log(`  Slug: ${slug}`);
    console.log(`  Date: ${dateStr}`);
    console.log(`  Tags: ${JSON.stringify(tags)}`);
    console.log(`  Description: ${description.substring(0, 50)}...`);
    console.log(`  Image: ${metadata.image || 'None'}`);
    console.log(`  Body length: ${body.length} chars`);

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would create page: ${title} (${slug})`);
        console.log('---');
        return;
    }

    // Create Page
    // Construct Properties
    const properties = {
        Page: { title: [{ text: { content: title } }] },
        Slug: { rich_text: [{ text: { content: slug } }] },
        Excerpt: { rich_text: [{ text: { content: description } }] },
        Date: { date: { start: dateStr } },
        Published: { checkbox: true },
        Tags: { multi_select: tags.map(t => ({ name: t })) },
    };

    if (coverUrl) {
        properties.FeaturedImage = {
            files: [{
                type: "external",
                name: "cover",
                external: { url: coverUrl }
            }]
        }
    }

    try {
        const response = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: properties,
        });
        const pageId = response.id;
        console.log(`Created page: ${title} (${pageId})`);

        // Process Body Blocks
        const blocks = markdownToBlocks(body);

        // Post-process blocks for images and chunking (Notion limit 100 blocks per request)
        const chunks = [];
        let currentChunk = [];

        for (const block of blocks) {
            if (block._isImage) {
                const imgUrl = await handleImage(block.src);
                if (imgUrl) {
                    currentChunk.push({
                        object: 'block',
                        type: 'image',
                        image: {
                            type: 'external',
                            external: { url: imgUrl },
                            caption: block.alt ? [{ type: 'text', text: { content: block.alt } }] : []
                        }
                    });
                } else {
                    // Fallback to text link if upload failed
                    currentChunk.push({
                        object: 'block',
                        type: 'paragraph',
                        paragraph: { rich_text: [{ type: 'text', text: { content: `![${block.alt}](${block.src})` } }] }
                    });
                }
            } else {
                currentChunk.push(block);
            }

            if (currentChunk.length >= 90) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk);

        // Append Children
        for (const chunk of chunks) {
            await notion.blocks.children.append({
                block_id: pageId,
                children: chunk
            });
        }
        console.log(`Appended content to ${title}`);

    } catch (error) {
        console.error(`Failed to migrate ${title}:`);
        console.error(`  Error name: ${error.name}`);
        console.error(`  Error message: ${error.message}`);
        console.error(`  Error code: ${error.code || 'N/A'}`);
        if (error.body) {
            console.error(`  Error body: ${JSON.stringify(error.body, null, 2)}`);
        }
        console.error(`  Stack trace: ${error.stack}`);
    }
}

async function main() {
    console.log('Starting migration...');

    // Blog Posts
    const blogDir = path.join(SOURCE_DIR, 'blog');
    if (fs.existsSync(blogDir)) {
        const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            await migrateFile(path.join(blogDir, file), 'blog');
        }
    }

    // Stories
    const storyDir = path.join(SOURCE_DIR, 'stories');
    if (fs.existsSync(storyDir)) {
        const files = fs.readdirSync(storyDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            await migrateFile(path.join(storyDir, file), 'story');
        }
    }

    console.log('Migration completed.');
}

main();
