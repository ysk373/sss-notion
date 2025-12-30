/**
 * R2 Upload Script
 * Cloudflare R2に画像をアップロードし、公開URLを返すスクリプト
 * 
 * 使用方法:
 *   node scripts/r2-upload.cjs <ファイルパス> [保存先パス]
 * 
 * 例:
 *   node scripts/r2-upload.cjs ./image.png
 *   node scripts/r2-upload.cjs ./image.png thumbnails/my-article.png
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 環境変数の読み込み
require('dotenv').config();

// R2設定
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sss-blog-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://images.sssstudy.com';

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
 * MIMEタイプを取得
 * @param {string} filePath ファイルパス
 * @returns {string} MIMEタイプ
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.bmp': 'image/bmp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * ユニークなファイル名を生成
 * @param {string} originalName 元のファイル名
 * @returns {string} ユニークなファイル名
 */
function generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    return `${baseName}-${timestamp}-${hash}${ext}`;
}

/**
 * R2にファイルをアップロード
 * @param {string} filePath ローカルファイルパス
 * @param {string} [destinationPath] R2での保存先パス（省略時は自動生成）
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function uploadToR2(filePath, destinationPath = null) {
    try {
        // ファイルの存在確認
        if (!fs.existsSync(filePath)) {
            throw new Error(`ファイルが見つかりません: ${filePath}`);
        }

        // ファイル読み込み
        const fileContent = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);

        // 保存先パスの決定
        const key = destinationPath || generateUniqueFileName(path.basename(filePath));

        // アップロード実行
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: mimeType,
        });

        await s3Client.send(command);

        // 公開URLを生成
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;

        return {
            success: true,
            url: publicUrl,
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
        console.log('使用方法: node scripts/r2-upload.cjs <ファイルパス> [保存先パス]');
        console.log('');
        console.log('例:');
        console.log('  node scripts/r2-upload.cjs ./image.png');
        console.log('  node scripts/r2-upload.cjs ./image.png thumbnails/my-article.png');
        process.exit(0);
    }

    const filePath = args[0];
    const destinationPath = args[1] || null;

    console.log(`アップロード中: ${filePath}`);

    const result = await uploadToR2(filePath, destinationPath);

    if (result.success) {
        console.log('✅ アップロード成功!');
        console.log(`📍 URL: ${result.url}`);
        console.log(`🔑 Key: ${result.key}`);
    } else {
        console.error('❌ アップロード失敗:', result.error);
        process.exit(1);
    }
}

// モジュールとしてエクスポート（他のスクリプトから使用可能）
module.exports = { uploadToR2 };

// 直接実行時のみmain()を呼び出し
if (require.main === module) {
    main();
}
