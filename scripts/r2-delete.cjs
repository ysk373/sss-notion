/**
 * R2 Delete Script
 * Cloudflare R2からファイルを削除するスクリプト
 * 
 * 使用方法:
 *   node scripts/r2-delete.cjs <R2キー>
 * 
 * 例:
 *   node scripts/r2-delete.cjs thumbnails/old-image.png
 *   node scripts/r2-delete.cjs articles/cloudflare-r2-blog-system/architecture.png
 */

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// 環境変数の読み込み
require('dotenv').config();

// R2設定
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sss-blog-images';

// 設定確認
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('エラー: R2の環境変数が設定されていません。');
    console.error('必要な環境変数: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    process.exit(1);
}

// S3クライアントの初期化（R2はS3互換）
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * R2からファイルを削除
 * @param {string} key R2のオブジェクトキー
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteFromR2(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);

        return {
            success: true,
            key: key,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}

// CLI実行
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('使用方法: node scripts/r2-delete.cjs <R2キー>');
        console.log('');
        console.log('例:');
        console.log('  node scripts/r2-delete.cjs thumbnails/old-image.png');
        console.log('  node scripts/r2-delete.cjs articles/my-article/diagram.png');
        process.exit(0);
    }

    const key = args[0];

    console.log(`削除中: ${key}`);

    const result = await deleteFromR2(key);

    if (result.success) {
        console.log('✅ 削除成功!');
        console.log(`🔑 Key: ${result.key}`);
    } else {
        console.error('❌ 削除失敗:', result.error);
        process.exit(1);
    }
}

// モジュールとしてエクスポート
module.exports = { deleteFromR2 };

// 直接実行時のみmain()を呼び出し
if (require.main === module) {
    main();
}
