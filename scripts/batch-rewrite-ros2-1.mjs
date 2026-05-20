/**
 * ROS2 入門シリーズ バッチ1 GEO リライト生成
 * tmp/articles-export/{slug}.json → tmp/rewrites/{slug}.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPORT_DIR = join(ROOT, 'tmp/articles-export');
const REWRITE_DIR = join(ROOT, 'tmp/rewrites');

const SLUGS = [
  'ros2-introduction',
  'ros2-installation',
  'ros2-core-concepts',
  'ros2-publisher-subscriber',
  'ros2-service-action',
  'ros2-custom-interfaces',
  'ros2-visualization-rviz2-rqt',
  'ros2-package-colcon',
  'ros2-tf2-coordinate-transform',
];

const KEEP_KINDS = new Set(['image', 'divider', 'unsupported', 'code']);

const DOCS = {
  humble: 'https://docs.ros.org/en/humble/',
  install:
    'https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html',
  distros: 'https://docs.ros.org/en/humble/Releases.html',
  concepts: 'https://docs.ros.org/en/humble/Concepts/Basic/About-Nodes.html',
  pubsub:
    'https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Writing-A-Simple-Py-Publisher-And-Subscriber.html',
  services:
    'https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Services/Understanding-ROS2-Services.html',
  actions:
    'https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.html',
  interfaces:
    'https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Custom-ROS2-Interfaces.html',
  rviz: 'https://docs.ros.org/en/humble/Tutorials/Intermediate/RViz/RViz-User-Guide/RViz-User-Guide.html',
  workspace:
    'https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Creating-A-Workspace/Creating-A-Workspace.html',
  colcon: 'https://colcon.readthedocs.io/en/released/',
  tf2: 'https://docs.ros.org/en/humble/Tutorials/Intermediate/Tf2/Tf2-Main.html',
  qos: 'https://docs.ros.org/en/humble/Concepts/Intermediate/About-Quality-of-Service-Settings.html',
  series: 'https://sssstudy.com/posts/series-ros2-intro/',
};

/** @type {Record<string, object>} */
const REWRITE_CONFIG = {
  'ros2-introduction': {
    excerpt:
      '2026年5月時点。ROS 2 の位置づけ、ROS 1 との設計差、ディストリビューション選び、ノード／トピック等の用語骨格を整理する入門記事。読了後は環境構築へ進める。',
    h2: {
      ROS2が生まれた背景: 'なぜ ROS2 が生まれたのか？ROS1 の限界と設計の違い',
      'ROS2のバージョン（ディストリビューション）':
        'ROS2 のディストリビューションとは？Humble の選び方',
      ROS2のアーキテクチャ概要:
        'ROS2 のアーキテクチャとは？DDS と主要コンポーネント',
      ROS2でできること: 'ROS2 で何ができる？産業・研究での活用例',
      ROS2学習ロードマップ: 'ROS2 入門の学習手順は？シリーズ①〜⑪の進め方',
      まとめ: 'ROS2 入門①のまとめ：押さえるべき要点',
      検証環境と失敗しやすい点: '検証環境とつまずきやすい点',
    },
    text: {
      '3eaf05a5-25e3-4141-97f6-6b8135e4fe13':
        '本記事は、組み込み・ロボット開発に初めて触れるエンジニア向けです。ROS 2（Robot Operating System 2）がミドルウェアとして何を担うのか、全体像を押さえることが目的です。',
      '6ec109f1-7f9c-41a5-9e70-3b024460aa6a':
        '読み終えると、ノード・トピック・サービス・アクションの関係が説明でき、[ROS 2入門シリーズ目次](' +
        DOCS.series +
        ') の②環境構築へ進める状態になります。2026年5月時点の情報です。ディストリビューションの EOL は [Humble 公式ドキュメント](' +
        DOCS.humble +
        ') で確認してください。',
      'f2a7e33c-d79a-43e2-8664-dce4e7d3ad39':
        'ROS 1（2007年〜）は研究用ロボット向けに設計され、多くの実績を持ちます。一方で製品利用やマルチプラットフォーム、セキュリティ面では限界も指摘されてきました。詳細は [ROS 2 Concepts](' +
        DOCS.concepts +
        ') も参照してください。',
      '5b66a860-db54-470d-b203-253cbc93faf4':
        'これらの課題に向き合い、通信基盤を含めて設計し直したのが ROS 2 です（名前は「OS」ですが、デスクトップ OS の代替ではありません）。',
      '3532403f-bc5c-81f8-9315-e7e24d4c67af':
        'ROS 2 は約1年ごとに新バージョン（ディストリビューション）がリリースされます。[リリース一覧](' +
        DOCS.distros +
        ') で EOL を確認してから選びましょう。',
      'bb823247-a7a1-44f6-b54c-110b27054898':
        'ディストリビューションの選び方: Ubuntu 22.04 なら Humble が手順書・情報と相性が良いことが多いです。Ubuntu 24.04 なら Jazzy を検討します。EOL や推奨は時期で変わるので、作業前に [ディストリビューション一覧](' +
        DOCS.distros +
        ') を確認してください。',
      'ceed020d-9280-4447-88a6-adc2b38ea324':
        'ROS 2 の通信基盤は DDS（Data Distribution Service）という標準規格です。[About DDS](' +
        DOCS.humble +
        'Concepts/Intermediate/About-Domain-ID.html) の解説も併せて読むと理解が深まります。',
      '54f5c9a9-0f4a-4601-a44f-50e8b8d5118e':
        'このシリーズでは [ROS 2入門目次](' +
        DOCS.series +
        ') の順番で学習を進めます。',
      'b48ebec7-0a19-47ff-b026-cf4ae1bc0d54':
        'この記事は概念整理が中心で、特定ロボット実機での End-to-End 検証はしていません。バージョンや OS で前提が変わるので、作業前に [対応表](' +
        DOCS.distros +
        ') を確認してください。',
    },
  },

  'ros2-installation': {
    excerpt:
      '2026年5月時点。Ubuntu 22.04（Jammy）へ ROS 2 Humble を入れる手順。公式インストールとの差分（rosdep/apt）と確認コマンド、よくあるエラーへの対処をまとめた実務メモ。',
    h2: {
      前提条件: 'ROS 2 Humble インストールの前提条件とは？',
      インストール手順: 'Ubuntu 22.04 への ROS 2 Humble インストール手順',
      インストール確認: 'ROS 2 のインストール確認方法',
      よくあるエラーと対処法: 'インストールでよくあるエラーと対処法',
      'Dockerでの環境構築（オプション）':
        'Docker で ROS 2 環境を構築する方法（オプション）',
      まとめ: 'ROS 2 環境構築のまとめ',
      検証環境と失敗しやすい点: '検証環境とつまずきやすい点',
    },
    stepH3ToNumbered: true,
    text: {
      'e10967ff-00ce-4169-ae59-932c55639424':
        '本記事は、ROS 2 をこれから触るエンジニア向けの環境構築手順です。Ubuntu 22.04 LTS 上に ROS 2 Humble を入れ、talker/listener で動作確認まで進めることが目的です。細部や更新は [Ubuntu 向け Humble インストール手順](' +
        DOCS.install +
        ') を正として読み、ここではローカルで詰まりやすい箇所だけ補強したメモです。2026年5月時点の情報です。',
      '291758a0-8ac5-46b2-be1d-29a294a55d30':
        'Windows ユーザーへ: WSL2（Windows Subsystem for Linux）でも ROS 2 は動作します。WSL2 に Ubuntu 22.04 を入れてから以下の手順を実行してください。[WSL 向けメモ](' +
        DOCS.install +
        ') も参照。',
      'b0b0a275-ef01-4965-a6f6-7ce7725ec15a':
        'ROS 2 は UTF-8 ロケールが必要です。以下のコマンドで設定します。',
      '27ee0dda-bd04-49d2-9ea5-cf426f4d1dfb':
        'ROS 2 を使うたびに手動で source するのは面倒なので、.bashrc に追記します。',
      '3532403f-bc5c-8115-a290-fd11dc8becf1':
        '実機での ROS スタック確認は環境によります。TurtleBot3 関連は別シリーズで扱い、ここではデスクトップ／ノート上の開発環境づくりに絞ります。',
    },
  },

  'ros2-core-concepts': {
    excerpt:
      '2026年5月時点。ROS 2 のノード・トピック・サービス・アクション・パラメータの概要と CLI 確認例。それぞれが向く用途の違いを図つきで整理する入門記事。',
    h2: {
      ROS2システムの全体像: 'ROS2 システムの全体像とは？ノードが協調する仕組み',
      '①ノード（Node）': 'ROS2 のノード（Node）とは？最小実行単位の考え方',
      '②トピック（Topic）': 'ROS2 のトピック（Topic）とは？非同期 Pub/Sub 通信',
      '③サービス（Service）':
        'ROS2 のサービス（Service）とは？同期 Req/Resp 通信',
      '④アクション（Action）':
        'ROS2 のアクション（Action）とは？長時間タスク向け通信',
      '4つの概念の使い分けまとめ':
        'ノード・トピック・サービス・アクションの使い分け方',
      'パラメータ（Parameter）':
        'ROS2 のパラメータ（Parameter）とは？ノード設定の切り出し',
      まとめ: 'ROS 2 基本概念のまとめ',
    },
    text: {
      'dee7d01a-0883-4b8e-8890-0ffb91d002be':
        '本記事は、ROS 2 環境構築済みのエンジニア向けです。ノード・トピック・サービス・アクション（とパラメータ）の骨格を押さえ、CLI で確認できる状態にすることが目的です。読み終えると通信パターンの使い分けが説明でき、次の Python 実装記事へ進めます。詳細は [ROS 2 Concepts](' +
        DOCS.concepts +
        ') も参照。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
      'd94ef96a-8615-43bf-a3a9-09a76cbd1e1c':
        'ROS 2 のシステムは、複数のノードがトピック・サービス・アクション経由で協調動作します。[About Topics](' +
        DOCS.humble +
        'Concepts/Basic/About-Topics.html) の解説も併読すると整理しやすいです。',
      '39a37577-024f-4682-a5ab-8dc57eb38a05':
        'CLI の細部やトピック名はディストリで異なります。出力は自分の環境で確認し、次記事ではトピックの Publisher / Subscriber を Python で実装します。',
    },
  },

  'ros2-publisher-subscriber': {
    excerpt:
      '2026年5月時点。ament_python の最小パッケージで Publisher と Subscriber を実装する手順。setuptools の console_scripts、colcon ビルドまで Humble 想定で解説。',
    h2: {
      事前準備: 'Publisher/Subscriber 実装の事前準備：ワークスペース作成',
      'Publisher（送信側）の実装':
        'Python で Publisher（送信側）を実装する方法',
      'Subscriber（受信側）の実装':
        'Python で Subscriber（受信側）を実装する方法',
      'エントリーポイント登録（setup.py と setup.cfg）':
        'setup.py でエントリーポイントを登録する方法',
      ビルドと実行: 'colcon ビルドと Publisher/Subscriber の実行手順',
      トピックの確認コマンド: 'トピック通信を確認する CLI コマンド',
      'QoS（Quality of Service）について':
        'QoS（Quality of Service）とは？入門レベルの設定',
      まとめ: 'トピック通信実装のまとめ',
      検証環境と失敗しやすい点: '検証環境とつまずきやすい点',
    },
    text: {
      'd9fc456a-58e1-45df-90b7-f7642a65e8f6':
        '本記事は、ROS 2 基本概念を理解したエンジニア向けです。Python で Publisher / Subscriber を書き、colcon でビルドして ros2 run まで動かすことが目的です。公式チュートリアル [Writing a simple publisher and subscriber (Python)](' +
        DOCS.pubsub +
        ') をベースに、詰まりやすい設定箇所を補強したメモです。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble を前提としています。',
      '6de76bbc-5e88-49cb-9cea-c2725be552e4':
        'QoS（Quality of Service）は通信の約束ごと。デフォルトでも動くことが多いですが、画像や LiDAR では BEST_EFFORT などを検討する場面があります。[About QoS](' +
        DOCS.qos +
        ') を参照。',
      '3532403f-bc5c-814b-9040-d8d6e1833e52':
        'デスクトップ上の colcon build と 2 ターミナル実行での確認メモです。TB3 実機とは無関係なので、トピック名やノード名は自分のワークスペースに合わせてください。',
    },
  },

  'ros2-service-action': {
    excerpt:
      '2026年5月時点。example_interfaces と turtlesim を題材に、サービス／アクションの Python 実装と CLI 確認までの手順。API 細部はディストリで差があります（Humble 想定）。',
    h2: {
      'サービス（Service）の実装': 'Python でサービス（Service）を実装する方法',
      検証環境と失敗しやすい点: 'サービス実装でつまずきやすい点',
      'アクション（Action）の実装':
        'Python でアクション（Action）を実装する方法',
      'サービス vs アクションの選び方（要点）':
        'サービスとアクションはどう選ぶ？判断基準',
      まとめ: 'サービス・アクション実装のまとめ',
    },
    text: {
      '86c6c638-1562-4746-80ae-78a97b11ed54':
        '本記事は、トピック通信を実装済みのエンジニア向けです。サービス（短時間の Req/Resp）とアクション（Goal／Feedback／Result）を Python から組み立てることが目的です。公式解説 [Understanding ROS 2 services](' +
        DOCS.services +
        ') と [Understanding ROS 2 actions](' +
        DOCS.actions +
        ') を併読すると整理しやすいです。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
      '18698124-a5e6-4f1a-90b0-ab6bd9ecf428':
        'call_async でリクエストを送ったあと、rclpy.spin_until_future_complete で 1 回分の応答を待ちます（内部では非同期 API）。本番構成ではイベントループ設計とも相性を確認すると安全です。[Services tutorial](' +
        DOCS.services +
        ') も参照。',
      '39540df4-0bd2-4a45-96c3-ff7410f15274':
        '記事の ros2 run my_pkg ... を試すには、次の骨組みが揃っている必要があります（Humble 想定。パッケージ名・エントリ名は環境に合わせて読み替えてください）。',
      '281e9389-490a-42fa-b1da-0e017813083e':
        '冒頭の図と同じ整理です。詳細は [Actions](' +
        DOCS.actions +
        ') の解説も参照してください。',
    },
  },

  'ros2-custom-interfaces': {
    excerpt:
      '2026年5月時点。.msg/.srv/.action を ament_cmake のインターフェース用パッケージにまとめ、rosidl_generate_interfaces で生成する手順。ビルド順と Python import まで解説（Humble 想定）。',
    h2: {
      なぜカスタムインターフェースが必要か:
        'なぜカスタムインターフェースが必要なのか？',
      インターフェースの種類:
        'ROS2 のインターフェース種類とは？.msg/.srv/.action',
      専用インターフェースパッケージの作成:
        'インターフェース専用パッケージの作成手順',
      'カスタムメッセージ（.msg）の定義':
        '.msg ファイルでカスタムメッセージを定義する方法',
      'カスタムサービス（.srv）の定義':
        '.srv ファイルでカスタムサービスを定義する方法',
      'カスタムアクション（.action）の定義':
        '.action ファイルでカスタムアクションを定義する方法',
      'CMakeLists.txt と package.xml の設定':
        'CMakeLists.txt と package.xml の設定方法',
      ビルドと確認: 'インターフェースパッケージのビルドと確認手順',
      Pythonノードで使う: 'Python ノードでカスタムインターフェースを使う方法',
      注意点: 'カスタムインターフェース定義の注意点',
      検証環境と失敗しやすい点: '検証環境とつまずきやすい点',
      標準インターフェースの確認コマンド:
        '標準インターフェースを確認する CLI コマンド',
      まとめ: 'カスタムインターフェース定義のまとめ',
    },
    text: {
      'c194fc3d-44a6-4d95-94df-874072e9a8d5':
        '本記事は、Publisher/Subscriber を実装済みのエンジニア向けです。カスタム .msg/.srv/.action を定義し、rosidl で生成された型をノードから使うまでを整理することが目的です。手順の正本は [Custom ROS 2 interfaces](' +
        DOCS.interfaces +
        ') です。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble を想定しています。',
      '6fe78cb7-3134-42af-a720-e57a4191c461':
        'ROS 2 には std_msgs/String や geometry_msgs/Twist など豊富な標準インターフェースがあります。[Interface packages](' +
        DOCS.humble +
        'Concepts/Basic/About-Interfaces.html) で一覧を確認してから独自定義を検討しましょう。',
      '19a5f607-4c1c-4d45-9902-781fb123169b':
        '運用メモ： インターフェース定義だけを ament_cmake のインターフェース用パッケージにまとめる構成がよく見られます。Python の実行ノードとは別パッケージにすると、複数ノードから同じ .msg/.srv/.action を参照しやすいです。[Custom interfaces tutorial](' +
        DOCS.interfaces +
        ') も参照。',
      'c497e968-b1de-41f3-8f9f-2e41c1fa6008':
        '独自定義の前に、既存の標準インターフェースを ros2 interface コマンドで確認することをおすすめします。',
    },
  },

  'ros2-visualization-rviz2-rqt': {
    excerpt:
      '2026年5月時点。RViz2 の Add／Fixed Frame、rqt_graph・rqt_plot など可視化ツールの入口。トピックと frame_id の対応を意識するデバッグメモ（Humble 想定）。',
    h2: {
      'RViz2 の概要': 'RViz2 とは？3D 可視化ツールの基本',
      RViz2でマーカーを表示する: 'RViz2 でマーカーを表示する方法',
      rqtの概要: 'rqt とは？プラグイン形式のデバッグ GUI',
      '実践: turtlesimでrqt_graphを見る': 'turtlesim で rqt_graph を試す手順',
      検証環境と失敗しやすい点: '可視化でつまずきやすい点',
      まとめ: 'RViz2 と rqt のまとめ',
    },
    text: {
      '0332a2e8-f6ff-4827-a573-930e90748afb':
        '本記事は、ROS 2 でノードを動かせるエンジニア向けです。RViz2（3D 可視化）と rqt（プラグイン形式 GUI）の基本操作を押さえ、デバッグ時に状態を「見える化」することが目的です。RViz2 の詳細は [RViz User Guide](' +
        DOCS.rviz +
        ') を正として読み、ここでは turtlesim を題材にした入口をまとめます。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
      '074204a8-454d-44d6-8a02-774d2490c046':
        'RViz2（ROS Visualization Tool 2）は、センサや TF、Path などを 3D ビューに重ねて確認するツールです（表示はトピック更新に追随します）。[RViz User Guide](' +
        DOCS.rviz +
        ') も参照。',
      '4f5c7ac0-11f8-4d83-80bd-484b29581e29':
        'rqt はプラグインベースの GUI デバッグツールです。Plugins メニューから rqt_graph、rqt_plot などを選びます。',
    },
  },

  'ros2-package-colcon': {
    excerpt:
      '2026年5月時点。ワークスペース構成、ament_python/ament_cmake パッケージのひな型、colcon build と source、launch で複数ノード起動までの手順（Humble 想定）。',
    h2: {
      ワークスペース構成: 'ROS 2 ワークスペースの構成とは？',
      Pythonパッケージの作成: 'ament_python パッケージの作成手順',
      'C++パッケージの作成': 'ament_cmake（C++）パッケージの作成手順',
      colconビルド: 'colcon build の使い方と source の手順',
      launchファイルで複数ノードを同時起動:
        'launch ファイルで複数ノードを起動する方法',
      検証環境と失敗しやすい点: 'パッケージ開発でつまずきやすい点',
      役立つ開発テクニック: 'ROS 2 開発で役立つテクニック',
      まとめ: 'パッケージと colcon のまとめ',
    },
    text: {
      'e989b24b-68f9-4f05-a3a0-efc87914946b':
        '本記事は、ROS 2 でコードを書き始めたエンジニア向けです。パッケージのひな型作成から colcon ビルド、install の読み込み、launch ファイルまでを一通り押さえることが目的です。公式チュートリアル [Creating a workspace](' +
        DOCS.workspace +
        ') と [colcon ドキュメント](' +
        DOCS.colcon +
        ') を併読すると理解が深まります。2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。',
    },
  },

  'ros2-tf2-coordinate-transform': {
    excerpt:
      '2026年5月時点。TF2 のフレームツリー、静的／動的ブロードキャスト、tf2_echo と view_frames まで。Python で座標変換を取得する雛形（Humble 想定）。',
    h2: {
      座標フレームとは: '座標フレーム（TF フレーム）とは？',
      TF2のインストール: 'TF2 関連パッケージのインストール手順',
      静的変換の配信: '静的変換（Static Transform）を配信する方法',
      動的変換の配信: '動的変換（Transform）を配信する方法',
      座標変換の取得: 'lookup_transform で座標変換を取得する方法',
      TFツリーの可視化: 'TF ツリーを可視化・確認する方法',
      検証環境と失敗しやすい点: 'TF2 でつまずきやすい点',
      まとめ: 'TF2 座標変換のまとめ',
    },
    text: {
      'e4ceea18-c4fb-47d1-b54d-eb92dcdcf54f':
        '本記事は、RViz2 やトピック通信に慣れたエンジニア向けです。TF2 でロボット上の複数座標系の位置・姿勢を扱い、センサ系と基座標をつなぐ方法を押さえることが目的です。公式チュートリアル [Introducing tf2](' +
        DOCS.tf2 +
        ') をベースに、ブロードキャストと lookup の典型パターンを整理します。',
      '4c39846c-1df8-46d4-a517-64ad4f622615':
        '2026年5月時点、Ubuntu 22.04 + ROS 2 Humble 想定です。毎回手計算しなくて済むのが TF2 のメリットです（利用するノード群の前提でもあります）。',
      'f16ccca3-c596-41bc-bc78-e0c064086cc9':
        'ロボットには base_link、camera_link、lidar_link など複数の座標フレーム（基準点）が存在します。[TF2 tutorial](' +
        DOCS.tf2 +
        ') の図解も併読してください。',
      '7010a655-97a1-4e3b-8c72-b72cba9e6678':
        '変化しない変換（カメラがロボットに固定されているなど）は静的変換で配信します。[Static transform publisher](' +
        DOCS.tf2 +
        ') も参照。',
    },
  },
};

function applyRewrite(exportData, config) {
  const blocks = exportData.blocks.map((b) => ({ ...b }));

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (KEEP_KINDS.has(block.kind)) continue;

    if (block.kind === 'heading_2' && config.h2?.[block.text]) {
      block.text = config.h2[block.text];
    }

    if (
      config.stepH3ToNumbered &&
      block.kind === 'heading_3' &&
      /^Step \d+:/.test(block.text)
    ) {
      block.kind = 'numbered_list_item';
      block.notionType = 'numbered_list_item';
      block.text = block.text.replace(/^Step \d+:\s*/, '');
    }

    if (config.text?.[block.notionId] !== undefined) {
      block.text = config.text[block.notionId];
    }
  }

  return {
    pageId: exportData.pageId,
    slug: exportData.slug,
    excerpt: config.excerpt,
    preserveImages: exportData.preserveImages,
    blocks,
  };
}

function main() {
  if (!existsSync(REWRITE_DIR)) mkdirSync(REWRITE_DIR, { recursive: true });

  let ok = true;
  for (const slug of SLUGS) {
    const exportPath = join(EXPORT_DIR, `${slug}.json`);
    const exportData = JSON.parse(readFileSync(exportPath, 'utf8'));
    const config = REWRITE_CONFIG[slug];
    if (!config) throw new Error(`No config for ${slug}`);

    const rewrite = applyRewrite(exportData, config);

    if (rewrite.blocks.length !== exportData.blocks.length) {
      console.error(
        `ERROR ${slug}: block count ${rewrite.blocks.length} != ${exportData.blocks.length}`
      );
      ok = false;
    }

    const outPath = join(REWRITE_DIR, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(rewrite, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${outPath} (${rewrite.blocks.length} blocks)`);
  }

  if (!ok) process.exit(1);
}

main();
