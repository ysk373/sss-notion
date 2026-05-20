/**
 * バッチ1 相互レビュー（シニア営業+エンジニア）結果を rewrites に反映
 * tmp/reviews/batch1-review.json → tmp/rewrites/*.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const reviewsPath = join(ROOT, 'tmp/reviews/batch1-review.json')
const rewritesDir = join(ROOT, 'tmp/rewrites')

const review = {
  batch: 1,
  series: 'ROS2入門',
  role: 'シニア営業+エンジニア',
  reviewedAt: '2026-05-20',
  summary:
    'GEO 向けリライトは外部リンク・鮮度マーカー・H2 改善が概ね達成。一方で全9件に「本記事は…目的です」のテンプレ導入が残り、営業+エンジニア視点では現場シーン接続と中立表現への修正を実施。',
  articles: [
    {
      slug: 'ros2-introduction',
      status: 'corrected',
      priority: '高',
      issues: [
        'DDS 解説リンクが About-Domain-ID を指しており文脈不一致（エンジニア）',
        '「本記事は…目的です」「読み終えると」のテンプレ導入（AI っぽさ）',
        '「理解が深まります」の抽象フィラー',
        'まとめ H2「押さえるべき要点」が語感重複',
      ],
      blockUpdates: [
        {
          notionId: '3eaf05a5-25e3-4141-97f6-6b8135e4fe13',
          kind: 'paragraph',
          text: '組み込み・ロボット開発に初めて触れる方向けに、ROS 2（Robot Operating System 2）がミドルウェアとして担う役割を整理します。Windows/Linux 上のデスクトップ OS ではなく、ノード間通信やツール群を束ねる層だと捉えると後続記事に進みやすいです。',
        },
        {
          notionId: '6ec109f1-7f9c-41a5-9e70-3b024460aa6a',
          kind: 'paragraph',
          text: '読了後はノード・トピック・サービス・アクションの関係を口頭で説明でき、[ROS 2入門シリーズ目次](https://sssstudy.com/posts/series-ros2-intro/) の②環境構築へ進める状態を目指します。ディストリビューションの EOL は作業前に [Humble 公式ドキュメント](https://docs.ros.org/en/humble/) で確認してください。',
        },
        {
          notionId: 'ceed020d-9280-4447-88a6-adc2b38ea324',
          kind: 'paragraph',
          text: 'ROS 2 の通信基盤は DDS（Data Distribution Service）という標準規格です。同一 LAN 上のノードがお互いを見つける仕組みもここに含まれます。詳細は [About middleware vendors](https://docs.ros.org/en/humble/Concepts/Intermediate/About-Different-Middleware-Vendors.html) を参照してください。',
        },
        {
          notionId: '400293a0-ad04-48d4-b720-0bb4adc2d9fe',
          kind: 'heading_2',
          text: 'ROS2 入門①のまとめ',
        },
      ],
    },
    {
      slug: 'ros2-installation',
      status: 'corrected',
      priority: '中',
      issues: [
        '「本記事は…目的です」のテンプレ導入',
        '手順記事としては妥当。ロケール/rosdep の補足は維持',
      ],
      blockUpdates: [
        {
          notionId: 'e10967ff-00ce-4169-ae59-932c55639424',
          kind: 'paragraph',
          text: 'Ubuntu 22.04 LTS へ ROS 2 Humble を入れ、talker/listener で動作確認する手順です。apt 手順の正本は [Ubuntu 向け Humble インストール手順](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html) で、ここでは locale や rosdep でローカル環境が詰まりやすい箇所を補足します。2026年5月時点の情報です。',
        },
      ],
    },
    {
      slug: 'ros2-core-concepts',
      status: 'corrected',
      priority: '高',
      issues: [
        'H2 が疑問形に偏り SEO テンプレ感（6/8）',
        '「本記事は…読み終えると」の二段テンプレ導入',
        '「整理しやすいです」の抽象フィラー',
        '「ノードはROS2」表記ゆれ',
      ],
      blockUpdates: [
        {
          notionId: 'dee7d01a-0883-4b8e-8890-0ffb91d002be',
          kind: 'paragraph',
          text: 'Humble 環境構築済みの状態から、ノード・トピック・サービス・アクション（とパラメータ）を CLI で確認できるところまで進めます。次の記事では Python でトピック通信を実装します。詳細は [ROS 2 Concepts](https://docs.ros.org/en/humble/Concepts/Basic/About-Nodes.html) を参照してください。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
        },
        {
          notionId: '86169385-b24b-41b5-9e5b-924a930abf4a',
          kind: 'heading_2',
          text: 'ROS2 システムの全体像：ノードが協調する仕組み',
        },
        {
          notionId: 'd94ef96a-8615-43bf-a3a9-09a76cbd1e1c',
          kind: 'paragraph',
          text: 'ROS 2 のシステムは、複数のノードがトピック・サービス・アクション経由で協調動作します。詳細は [About Topics](https://docs.ros.org/en/humble/Concepts/Basic/About-Topics.html) を参照してください。',
        },
        {
          notionId: '6f67178a-a7c4-4688-8656-a46226682997',
          kind: 'paragraph',
          text: 'ノードは ROS 2 における最小実行単位のプログラムです。1 つのノードは 1 つの役割（責務）を持ちます。',
        },
      ],
    },
    {
      slug: 'ros2-publisher-subscriber',
      status: 'corrected',
      priority: '中',
      issues: [
        '「本記事は…目的です」のテンプレ導入',
        '手順・QoS 補足は技術的に妥当',
      ],
      blockUpdates: [
        {
          notionId: 'd9fc456a-58e1-45df-90b7-f7642a65e8f6',
          kind: 'paragraph',
          text: 'ROS 2 基本概念を理解した状態から、Python で Publisher / Subscriber を書き、colcon でビルドして ros2 run まで動かします。公式 [Writing a simple publisher and subscriber (Python)](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Writing-A-Simple-Py-Publisher-And-Subscriber.html) をベースに、setup.py の console_scripts など詰まりやすい設定を補足します。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble を前提としています。',
        },
      ],
    },
    {
      slug: 'ros2-service-action',
      status: 'corrected',
      priority: '中',
      issues: [
        '「併読すると整理しやすいです」の抽象フィラー',
        'turtlesim 用途の対比（即応 vs 長時間）が導入で伝わると読者の判断材料になる',
      ],
      blockUpdates: [
        {
          notionId: '86c6c638-1562-4746-80ae-78a97b11ed54',
          kind: 'paragraph',
          text: 'トピック通信を実装済みの状態から、サービス（短時間 Req/Resp）とアクション（Goal／Feedback／Result）を Python で組み立てます。turtlesim では「今の姿勢を即返す」処理と「数秒かかる移動」を用途で分けます。正本は [Understanding ROS 2 services](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Services/Understanding-ROS2-Services.html) と [Understanding ROS 2 actions](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.html) です。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
        },
      ],
    },
    {
      slug: 'ros2-custom-interfaces',
      status: 'corrected',
      priority: '高',
      issues: [
        '「おすすめします」「検討しましょう」の営業調表現',
        '標準型の確認手順を中立表現に',
      ],
      blockUpdates: [
        {
          notionId: 'c194fc3d-44a6-4d95-94df-874072e9a8d5',
          kind: 'paragraph',
          text: 'Publisher/Subscriber を実装済みの状態から、カスタム .msg/.srv/.action を定義し rosidl 生成型を import するまでを示します。正本は [Custom ROS 2 interfaces](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Custom-ROS2-Interfaces.html) です。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble を想定しています。',
        },
        {
          notionId: '6fe78cb7-3134-42af-a720-e57a4191c461',
          kind: 'paragraph',
          text: 'ROS 2 には std_msgs/String や geometry_msgs/Twist など標準インターフェースがあります。[Interface packages](https://docs.ros.org/en/humble/Concepts/Basic/About-Interfaces.html) で一覧を確認し、上書きできる型がないか先に確かめてから .msg を書くと手戻りが減ります。',
        },
        {
          notionId: 'c497e968-b1de-41f3-8f9f-2e41c1fa6008',
          kind: 'paragraph',
          text: '独自定義の前に `ros2 interface list` / `ros2 interface show` で既存型を確認してください。',
        },
      ],
    },
    {
      slug: 'ros2-visualization-rviz2-rqt',
      status: 'corrected',
      priority: '中',
      issues: [
        '「見える化」「押さえる」の抽象表現',
        'Fixed Frame トラブルという現場シーンを導入に追加',
      ],
      blockUpdates: [
        {
          notionId: '0332a2e8-f6ff-4827-a573-930e90748afb',
          kind: 'paragraph',
          text: 'ノードを ros2 run できる状態から、RViz2 で 3D 表示、rqt でトピックグラフを確認する入口を示します。デバッグ中に「トピックは流れているのに RViz が真っ白」となったとき Fixed Frame と frame_id を疑う場面が多いです。正本は [RViz User Guide](https://docs.ros.org/en/humble/Tutorials/Intermediate/RViz/RViz-User-Guide/RViz-User-Guide.html) です。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
        },
      ],
    },
    {
      slug: 'ros2-package-colcon',
      status: 'corrected',
      priority: '中',
      issues: [
        '「理解が深まります」の抽象フィラー',
        'チーム開発での src/install/log 共有という業務文脈が導入にない',
      ],
      blockUpdates: [
        {
          notionId: 'e989b24b-68f9-4f05-a3a0-efc87914946b',
          kind: 'paragraph',
          text: 'コードを書き始めた段階で、src/install/log の役割と colcon build → source install/setup.bash の流れを共有できる状態を目指します。複数パッケージを launch でまとめて起動する典型も含みます。正本は [Creating a workspace](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Creating-A-Workspace/Creating-A-Workspace.html) と [colcon ドキュメント](https://colcon.readthedocs.io/en/released/) です。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
        },
      ],
    },
    {
      slug: 'ros2-tf2-coordinate-transform',
      status: 'corrected',
      priority: '高',
      issues: [
        '「メリット」の営業調表現（元 export にもあったがリライトで残存）',
        'テンプレ導入により LiDAR→base_link の具体シーンが薄れた',
        '鮮度マーカーが2段落目に分離',
      ],
      blockUpdates: [
        {
          notionId: 'e4ceea18-c4fb-47d1-b54d-eb92dcdcf54f',
          kind: 'paragraph',
          text: 'RViz2 やトピック通信に慣れた状態から、TF2 で複数座標系の位置・姿勢を扱う手順を示します。例えば LiDAR の点群を base_link 基準にそろえるとき、毎回三角関数で計算せず lookup_transform に任せられます。正本は [Introducing tf2](https://docs.ros.org/en/humble/Tutorials/Intermediate/Tf2/Tf2-Main.html) です。',
        },
        {
          notionId: '4c39846c-1df8-46d4-a517-64ad4f622615',
          kind: 'paragraph',
          text: '2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
        },
      ],
    },
  ],
}

function mergeReview(slug, item) {
  const rewritePath = join(rewritesDir, `${slug}.json`)
  if (!existsSync(rewritePath)) {
    console.warn(`Skip: no rewrite for ${slug}`)
    return
  }
  const rewrite = JSON.parse(readFileSync(rewritePath, 'utf8'))
  if (item.excerpt) rewrite.excerpt = item.excerpt
  if (item.blockUpdates?.length) {
    const map = new Map(item.blockUpdates.map((u) => [u.notionId, u]))
    rewrite.blocks = rewrite.blocks.map((b) => {
      const u = map.get(b.notionId)
      if (!u) return b
      return { ...b, ...u }
    })
    rewrite.blockUpdates = item.blockUpdates
  }
  writeFileSync(rewritePath, JSON.stringify(rewrite, null, 2) + '\n', 'utf8')
  console.log(`Merged ${slug}: ${item.blockUpdates?.length ?? 0} blocks`)
}

function main() {
  const reviewsDir = join(ROOT, 'tmp/reviews')
  if (!existsSync(reviewsDir)) mkdirSync(reviewsDir, { recursive: true })
  writeFileSync(reviewsPath, JSON.stringify(review, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${reviewsPath}`)
  for (const item of review.articles) {
    mergeReview(item.slug, item)
  }
}

main()
