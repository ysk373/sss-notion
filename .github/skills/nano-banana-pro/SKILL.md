---
description: |
  画像生成スキル。
  ユーザーが「画像を生成して」「イラストを作って」「画像を作成して」と言った時に使用する。
  generate-image.js（Gemini API）を使用して高品質な画像を生成する。
  サムネイル、イラスト、写実的な画像など多様な用途に対応。
---

# 画像生成（generate-image.js）

Gemini API（`gemini-3.1-flash-image-preview`）を使用して画像を生成します。
サムネイル画像、イラスト、デッサン、写実的な画像など多様な用途に対応します。

## 前提条件

- 環境変数 `GENERATE_IMAGE_SCRIPT`: `C:\dev\git\scripts\generate-image.js`
- 環境変数 `GEMINI_IMAGE_API_KEY`: Gemini APIキー

## 使用方法

```bash
node $GENERATE_IMAGE_SCRIPT "プロンプト"
```

- 第1引数: 画像生成プロンプト（英語推奨）
- 第2引数（省略可）: 出力ファイルパス。省略時はシステム一時ディレクトリに保存
- 出力先のパスはコンソールに表示される

### 例

```bash
# 一時ディレクトリに保存
node $GENERATE_IMAGE_SCRIPT "a cat playing piano in watercolor style"

# 出力先を指定
node $GENERATE_IMAGE_SCRIPT "modern tech blog thumbnail, clean design, 16:9 aspect ratio, minimalist" "./output/thumbnail.png"
```

## プロンプトのコツ

良いプロンプトには以下の要素を含めてください:

1. **主題**: 何を描くか（例: "a cat", "sunset coastline"）
2. **スタイル**: 画風（例: "watercolor", "pencil sketch", "photorealistic", "flat illustration"）
3. **構図**: レイアウト（例: "16:9 aspect ratio", "centered", "close-up"）
4. **背景**: 背景の指定（例: "white background", "gradient background"）
5. **品質**: 品質指定（例: "high quality", "detailed", "professional"）

### サムネイル画像向けプロンプト

ブログ記事のサムネイルには以下を意識:
- シンプルで目を引くデザイン
- テキストが重ねやすい余白のある構図
- 16:9のアスペクト比を明示
- 記事の内容を視覚的に表現するイメージ

### ブロック図・アーキテクチャ図のプロンプト作成ルール

AIが余分な線・ボックスを生成する問題を防ぐため、以下を厳守する:

1. **要素数を明示** — `Draw EXACTLY [N] rectangular boxes and [M] arrows`
2. **各ボックスを番号付きで列挙** — `(1) Box labeled 'A', (2) Box labeled 'B' ...`
3. **矢印を向き・ラベル付きで指定** — `arrow pointing RIGHT from 'A' to 'B', labeled 'ラベル' above`
4. **余計な要素を禁止** — `Draw ONLY these [N] boxes and [M] arrows. NO extra lines, NO extra boxes.`
5. **テキスト誤字防止** — `All text must be spelled correctly in English and Japanese. No typos.`

**パターン別テンプレート**:

縦積みアーキテクチャ:
```
"Vertical layout top-to-bottom. Draw EXACTLY [N] boxes:
(1) Top box labeled '...'
(2) Middle box labeled '...'
(3) Bottom box labeled '...'
Draw EXACTLY [M] vertical arrows between consecutive boxes.
Draw ONLY these elements."
```

左右クライアント-サーバー（通信パターン）:
```
"LEFT box labeled '[Client]'. RIGHT box labeled '[Server]'.
Draw EXACTLY [N] arrows from top to bottom:
  Arrow 1: pointing RIGHT from Client to Server, labeled '[ラベル]' above
  Arrow 2: dashed arrow pointing LEFT from Server to Client, labeled '[ラベル]' above
Draw ONLY these 2 boxes and [N] arrows. No extra lines."
```

時系列フロー（ステップ図）:
```
"[N] sequential steps arranged LEFT-TO-RIGHT with horizontal arrows between consecutive steps.
Step 1 (leftmost): Rectangle labeled '[タイトル]' with notes: '- 説明'
Step 2: Rectangle labeled '[タイトル]' ...
Draw [N-1] horizontal arrows Step1→Step2→...→StepN."
```

### 推奨仕様（サムネイル用）

| 項目           | 推奨値                 |
| -------------- | ---------------------- |
| サイズ         | 1200x630px (OGP最適化) |
| フォーマット   | PNG                    |
| ファイルサイズ | 500KB以下              |

## R2アップロードとの連携

画像生成後にR2アップロード・Notion設定まで行う場合は `add-thumbnail` スキルを参照してください。

```bash
# 1. 画像を生成（一時ディレクトリに保存される）
node $GENERATE_IMAGE_SCRIPT "プロンプト"

# 2. コンソールに表示されたパスでR2にアップロード
npm run r2:upload -- "/tmp/generate-image-xxxxx.png" thumbnails/記事スラッグ.png

# 3. NotionのFeaturedImageに設定（MCP API-patch-page）
```
