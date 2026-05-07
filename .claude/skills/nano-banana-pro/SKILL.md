---

## name: nano-banana-pro

description: |
画像生成スキル。
generate-image.js（Gemini API）を使用して高品質な画像を生成する。
サムネイル、イラスト、写実的な画像など多様な用途に対応。
context: fork

# 画像生成スキル（generate-image.js）

## 概要

Gemini API（`gemini-3.1-flash-image-preview`）を使用して画像を生成するスキルです。
サムネイル画像、イラスト、デッサン、写実的な画像など多様な用途に対応します。

## 前提条件

- 環境変数 `GENERATE_IMAGE_SCRIPT` にスクリプトのパスを設定
  ```bash
  export GENERATE_IMAGE_SCRIPT="C:\dev\git\scripts\generate-image.js"
  ```
- 環境変数 `GEMINI_IMAGE_API_KEY` にGemini APIキーを設定

## 使用方法

```bash
node $GENERATE_IMAGE_SCRIPT "プロンプト"
```

- 第1引数: 画像生成プロンプト（英語推奨）
- 第2引数（省略可）: 出力ファイルパス。省略時はシステム一時ディレクトリに保存（ローカルにファイルが溜まらない）
- 出力先のパスはコンソールに表示される

### 例

基本的な画像生成（一時ディレクトリに保存）:

```bash
node $GENERATE_IMAGE_SCRIPT "a cat playing piano in watercolor style"
```

出力先を指定する場合:

```bash
node $GENERATE_IMAGE_SCRIPT "modern tech blog thumbnail, clean design, 16:9 aspect ratio, minimalist" "./output/thumbnail.png"
```

## プロンプトのコツ

### 基本要素

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

### ブロック図・アーキテクチャ図のプロンプト（重要）

ブロック図や構成図を生成する場合、**AIが余分な線・ボックスを描く問題**が起きやすい。
以下のルールで極めて詳細なプロンプトを書くこと。

#### 必須：要素を完全に列挙する

```
悪い例（曖昧）:
"Draw a block diagram of ROS2 architecture with nodes and layers"

良い例（詳細）:
"Draw a hand-drawn whiteboard sketch diagram with EXACTLY 3 rectangular boxes and 2 arrows.
(1) Top box labeled 'ROS2 Application (ノード、トピック、サービス)'.
(2) Middle box labeled 'ros_gz_bridge (ブリッジ)'.
(3) Bottom box labeled 'Gazebo シミュレーター (物理エンジン、センサー)'.
Draw EXACTLY 2 bidirectional arrows: one between box1 and box2 labeled 'ROS2 topics/services',
one between box2 and box3 labeled 'Gazebo msgs'.
Draw ONLY these 3 boxes and 2 arrows. NO extra lines, NO extra boxes, NO decorations."
```

#### 要素の書き方テンプレート

**ボックス指定**

- `Rectangle box labeled 'ラベル'` — 矩形ボックス
- `with subtitle '補足テキスト'` — ボックス内サブテキスト
- 位置: `on the LEFT / in the CENTER / on the RIGHT` / `TOP / BOTTOM`

**矢印指定**

- `A single arrow pointing RIGHT from 'A' to 'B', labeled 'ラベル' above the arrow` — 単方向
- `A bidirectional arrow between 'A' and 'B', labeled 'ラベル'` — 双方向
- フィードバック矢印は `dashed arrow` で指定

**レイアウト指定**

- `Vertical layout top-to-bottom`
- `Horizontal left-to-right layout`
- `Hierarchical: X at top, Y and Z at middle, W at bottom`

**「それだけ描く」宣言（必須）**

```
Draw ONLY these [N] boxes and [M] arrows. No extra lines, no extra boxes, no decorations.
```

**テキスト誤字防止**

```
All text must be spelled correctly in English and Japanese. No typos.
```

#### シーケンス図（時系列ステップ）のテンプレート

```
"Draw a hand-drawn whiteboard sketch with [N] sequential steps arranged LEFT-TO-RIGHT.
Step 1 (leftmost rectangle): Title 'STEP1' with bullet points below: '- 説明1' '- 説明2'
Step 2 (rectangle): Title 'STEP2' ...
[各ステップを同様に記述]
Draw [N-1] horizontal arrows pointing right between consecutive steps.
White background, black ink, detailed educational sketch."
```

#### 通信パターン図（クライアント-サーバー）のテンプレート

```
"Draw a hand-drawn whiteboard sketch of [通信名] communication pattern.
Title at top: '[タイトル]'.
LEFT rectangle labeled '[Client名]'.
RIGHT rectangle labeled '[Server名]'.
Draw EXACTLY [N] arrows from top to bottom:
  Arrow 1: pointing RIGHT from Client to Server, labeled '[ラベル]' above
  Arrow 2: dashed arrow pointing LEFT from Server to Client, labeled '[ラベル]' above
  Arrow 3: solid arrow pointing LEFT from Server to Client, labeled '[ラベル]' above
White background, black ink, rough sketch style, no extra lines."
```

### 推奨仕様（サムネイル用）

| 項目           | 推奨値                 |
| -------------- | ---------------------- |
| サイズ         | 1200x630px (OGP最適化) |
| フォーマット   | PNG                    |
| ファイルサイズ | 500KB以下              |

## R2アップロードとの連携

画像生成後、R2にアップロードしてNotionに設定する場合:

```bash
# 1. 画像を生成（一時ディレクトリに保存される）
node $GENERATE_IMAGE_SCRIPT "プロンプト"

# 2. コンソールに表示されたパスでR2にアップロード
npm run r2:upload -- "/tmp/generate-image-xxxxx.png" thumbnails/記事スラッグ.png

# 3. NotionのFeaturedImageに設定（MCP API-patch-page）
```

詳細は `add-thumbnail` スキルを参照してください。
