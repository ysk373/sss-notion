/**
 * Minimal Test Script for Notion API
 */
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_SECRET });
const DATABASE_ID = process.env.DATABASE_ID;

async function testCreate() {
    console.log('Testing Notion API connection...');
    console.log('DATABASE_ID:', DATABASE_ID ? DATABASE_ID.substring(0, 8) + '...' : 'MISSING');
    console.log('API_SECRET:', process.env.NOTION_API_SECRET ? 'SET' : 'MISSING');

    try {
        const response = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                Page: { title: [{ text: { content: 'Test Migration Article' } }] },
                Slug: { rich_text: [{ text: { content: 'test-migration-article' } }] },
                Excerpt: { rich_text: [{ text: { content: 'This is a test article.' } }] },
                Date: { date: { start: '2025-12-30' } },
                Published: { checkbox: true },
                Tags: { multi_select: [{ name: 'Test' }] },
            },
        });
        console.log('SUCCESS! Page created with ID:', response.id);
    } catch (error) {
        console.error('FAILED!');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error body:', JSON.stringify(error.body, null, 2));
        console.error('Status:', error.status);
    }
}

testCreate();
