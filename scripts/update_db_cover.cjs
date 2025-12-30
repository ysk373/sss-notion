const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_SECRET });
const databaseId = process.env.DATABASE_ID || '2d82403f-bc5c-819f-a7f6-f1caee97d49f';
const coverUrl = "https://images.sssstudy.com/assets/header-main.png";

async function main() {
    try {
        await notion.databases.update({
            database_id: databaseId,
            cover: {
                type: 'external',
                external: {
                    url: coverUrl
                }
            }
        });
        console.log("Database cover updated.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
