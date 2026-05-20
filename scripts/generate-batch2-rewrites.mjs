/**
 * バッチ2 GEO リライト JSON 生成（tmp/articles-export → tmp/rewrites）
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exportDir = join(__dirname, '../tmp/articles-export');
const rewriteDir = join(__dirname, '../tmp/rewrites');

const SLUGS = [
  'ros2-gazebo-simulation',
  'ros2-nav2-navigation',
  'turtlebot3-ros2-overview',
  'turtlebot3-ros2-host-pc-setup',
  'turtlebot3-ros2-raspberry-pi-setup',
  'turtlebot3-ros2-network-setup',
  'turtlebot3-ros2-setup-04-network-ssh',
  'turtlebot3-ros2-bringup-teleop',
];

const LINKS = {
  humble:
    '[ROS 2 Humble 公式ドキュメント](https://docs.ros.org/en/humble/index.html)',
  gazebo: '[Gazebo（gz-sim）公式](https://gazebosim.org/docs)',
  rosGz: '[ros_gz ドキュメント](https://github.com/gazebosim/ros_gz)',
  nav2: '[Nav2 公式ドキュメント](https://navigation.ros.org/)',
  tb3: '[TurtleBot3 e-Manual](https://emanual.robotis.com/docs/en/platform/turtlebot3/overview/)',
  tb3Quick:
    '[TurtleBot3 Quick Start](https://emanual.robotis.com/docs/en/platform/turtlebot3/quick-start/)',
  ubuntuNetplan:
    '[Ubuntu netplan リファレンス](https://netplan.readthedocs.io/en/stable/)',
  rpiImager: '[Raspberry Pi Imager](https://www.raspberrypi.com/software/)',
  domainId:
    '[ROS_DOMAIN_ID の説明](https://docs.ros.org/en/humble/Concepts/Intermediate/About-Domain-ID.html)',
  seriesRos2:
    '[ROS2入門シリーズ目次](https://sssstudy.com/posts/series-ros2-intro/)',
  seriesTb3:
    '[TurtleBot3 ROS2環境構築シリーズ目次](https://sssstudy.com/posts/series-turtlebot3-ros2/)',
  networkSetup:
    '[Wi-FiとDDS疎通（④）](https://sssstudy.com/posts/turtlebot3-ros2-network-setup/)',
  networkSsh:
    '[netplan・SSH・固定IP（⑤）](https://sssstudy.com/posts/turtlebot3-ros2-setup-04-network-ssh/)',
};

const H2_MAP = {
  'ros2-gazebo-simulation': {
    Gazeboの特徴: 'Gazebo（gz-sim）では何がシミュレーションできる？',
    Gazeboのインストール: 'ROS 2 Humble に Gazebo 関連パッケージはどう入れる？',
    TurtleBot3でシミュレーションを試す:
      'TurtleBot3 の Gazebo シミュはどう起動する？',
    'URDF（ロボットモデル定義）の基礎': 'URDF でロボットモデルはどう定義する？',
    ROS2とGazeboの接続構造: 'ROS 2 と Gazebo はどう接続される？',
    シミュレーションでデータを確認する:
      'シミュ上のセンサーデータはどう確認する？',
    検証環境と失敗しやすい点: 'Gazebo 連携でよくある失敗は何か？',
    まとめ: 'Gazebo 入門の要点は？',
  },
  'ros2-nav2-navigation': {
    Nav2の全体像: 'Nav2（Navigation 2）の構成はどうなっている？',
    SLAMで地図を作る: 'SLAM で地図はどう作る？',
    Nav2で自律移動: 'Nav2 で自律移動はどう試す？',
    PythonからNav2にゴールを送る: 'Python から Nav2 にゴールはどう送る？',
    コストマップの仕組み: 'コストマップとは何か？',
    検証環境と失敗しやすい点: 'Nav2 試行でつまずきやすい点は？',
    シリーズまとめ: 'ROS 2 入門シリーズの振り返りは？',
  },
  'turtlebot3-ros2-overview': {
    TurtleBot3とは: 'TurtleBot3 とは何か？',
    モデル比較: 'Burger / Waffle / Waffle Pi はどう違う？',
    'ハードウェア構成（Burger）': 'Burger のハードウェア構成は？',
    ROS2ソフトウェアアーキテクチャ: 'ホストPCと TurtleBot3 の ROS 2 構成は？',
    ROS2対応バージョン: 'TurtleBot3 が対応する ROS 2 は？',
    標準構成で試しやすい機能例: 'TurtleBot3 で試しやすい機能は？',
    必要なもの: '実機あり・シミュのみで必要なものは？',
    '用語ミニ辞典（入口）': '最初に押さえる用語は？',
    まとめ: 'TurtleBot3 概要の要点は？',
    検証環境と未検証になり得る範囲: 'この記事の検証範囲は？',
  },
  'turtlebot3-ros2-host-pc-setup': {
    前提条件: 'ホストPCの前提条件は？',
    'Step 1: ROS2 Humbleのインストール':
      'Step 1: ホストPCに ROS 2 Humble はどう入れる？',
    'Step 2: TurtleBot3パッケージのインストール':
      'Step 2: TurtleBot3 向けパッケージは何を入れる？',
    'Step 3: 環境変数の設定': 'Step 3: TURTLEBOT3_MODEL と ROS_DOMAIN_ID は？',
    'Step 4: Gazeboシミュレーションで動作確認':
      'Step 4: Gazebo で動作確認するには？',
    インストール済みパッケージの確認:
      'インストール済みパッケージはどう確認する？',
    トラブルシューティング: 'ホストPCセットアップで困ったら？',
    まとめ: 'ホストPC構築の要点は？',
    '検証環境と適用範囲（ホストPC）': 'この記事の検証範囲は？',
  },
  'turtlebot3-ros2-raspberry-pi-setup': {
    用意するもの: 'Raspberry Pi 4 セットアップに必要なものは？',
    'Step 1: Ubuntu Server 22.04のmicroSD書き込み':
      'Step 1: microSD へ Ubuntu Server はどう書き込む？',
    'Step 2: Raspberry Pi 4の初回起動とSSH接続':
      'Step 2: 初回起動と SSH 接続は？',
    'Step 3: Raspberry Pi 4の基本設定': 'Step 3: RPi4 の基本設定は？',
    'Step 4: ROS2 Humbleのインストール':
      'Step 4: RPi4 に ROS 2 Humble はどう入れる？',
    'Step 5: .bashrcへの環境変数設定': 'Step 5: .bashrc の環境変数は？',
    'Step 6: OpenCRファームウェアの書き込み':
      'Step 6: OpenCR ファームウェアはどう書き込む？',
    トラブルシューティング: 'RPi4 セットアップで困ったら？',
    まとめ: 'RPi4 セットアップの要点は？',
  },
  'turtlebot3-ros2-network-setup': {
    ROS2マルチマシン通信の仕組み: 'ROS 2 のマルチマシン通信の仕組みは？',
    'Step 1: TurtleBot3（RPi4）のWi-Fi設定':
      'Step 1: RPi4 の Wi-Fi はどう設定する？',
    'Step 2: ROS_DOMAIN_IDの統一': 'Step 2: ROS_DOMAIN_ID はどう揃える？',
    'Step 3: ファイアウォールの確認':
      'Step 3: ファイアウォールは何を確認する？',
    'Step 4: 通信確認（talker / listener）':
      'Step 4: talker / listener で疎通確認するには？',
    'Step 5: 固定IPアドレスの設定（推奨）': 'Step 5: 固定 IP はどう設定する？',
    'Step 6: SSH接続の便利化': 'Step 6: SSH 接続を楽にするには？',
    トラブルシューティング: 'マルチマシン通信で困ったら？',
    まとめ: 'ネットワーク設定の要点は？',
    '検証環境（この記事の前提）': 'この記事の検証範囲は？',
  },
  'turtlebot3-ros2-setup-04-network-ssh': {
    はじめに: 'この記事で何ができるようになる？',
    ネットワーク構成の全体像: 'HostPC と TurtleBot3 のネットワーク構成は？',
    'Raspberry PiのWiFi設定':
      'Raspberry Pi の Wi-Fi は netplan でどう設定する？',
    SSHを有効化してホストPCから接続する:
      'SSH でホストPCから RPi4 に接続するには？',
    固定IPアドレスの設定: '固定 IP（DHCP 予約）はなぜ必要か？',
    ROS2のネットワーク設定: 'ROS 2 の ROS_DOMAIN_ID はどう揃える？',
    接続確認: 'ping と ros2 topic で疎通はどう確認する？',
    よくあるトラブルと解決策: 'ネットワーク・SSH でよくあるトラブルは？',
    まとめ: 'ネットワーク・SSH 設定の要点は？',
    検証環境: 'この記事の検証環境は？',
  },
  'turtlebot3-ros2-bringup-teleop': {
    起動前チェックリスト: 'bringup 前に何を確認する？',
    'Step 1: TurtleBot3への電源投入': 'Step 1: 電源投入の順序は？',
    'Step 2: TurtleBot3 Bringup': 'Step 2: bringup はどう起動する？',
    'Step 3: キーボード操縦（teleop_keyboard）':
      'Step 3: teleop_keyboard で操縦するには？',
    'Step 4: RViz2でリアルタイム可視化': 'Step 4: RViz2 で LiDAR はどう見る？',
    'Step 5: 各センサーデータの確認': 'Step 5: センサーデータはどう確認する？',
    よく使うコマンドのまとめ: 'よく使うコマンドは？',
    トラブルシューティング: 'bringup・teleop で困ったら？',
    まとめ: '初回起動・操縦の要点は？',
  },
};

const EXCERPT_MAP = {
  'ros2-gazebo-simulation':
    '2026年5月時点。ROS 2 Humble で Gazebo（ros_gz）と TurtleBot3 シミュを起動し、URDF とトピック確認までを整理した入門メモです。',
  'ros2-nav2-navigation':
    '2026年5月時点。Nav2 の構成と、TurtleBot3 シミュでの SLAM→地図保存→自律移動の流れを、公式ドキュメントへのリンク付きで整理します。',
  'turtlebot3-ros2-overview':
    '2026年5月時点。TurtleBot3 のモデル・ハード構成・ROS 2 マルチマシン構成の入口。e-Manual と Humble 公式へのリンクで確認手順を揃えます。',
  'turtlebot3-ros2-host-pc-setup':
    '2026年5月時点。Ubuntu 22.04 ホストPCへ ROS 2 Humble と TurtleBot3 パッケージを入れ、環境変数と Gazebo 確認まで。e-Manual と重なる手順は要約します。',
  'turtlebot3-ros2-raspberry-pi-setup':
    '2026年5月時点。TurtleBot3 Burger の RPi4 へ Ubuntu Server 22.04・ROS 2 Humble・OpenCR ファームまで。Imager と e-Manual へのリンク付き手順です。',
  'turtlebot3-ros2-network-setup':
    '2026年5月時点。RPi4 の Wi-Fi と ROS_DOMAIN_ID を揃え、talker/listener で DDS 疎通を確認。netplan・固定IPの詳細は⑤の記事へ誘導します。',
  'turtlebot3-ros2-setup-04-network-ssh':
    '2026年5月時点。netplan で Wi-Fi、SSH、固定 IP、ROS_DOMAIN_ID を設定し HostPC と TB3 を接続。同一 LAN 前提の実務手順です。',
  'turtlebot3-ros2-bringup-teleop':
    '2026年5月時点。TurtleBot3 実機の bringup、teleop_keyboard、RViz2 での LiDAR 可視化まで。電源順序とトラブル対処を含む初回起動ガイドです。',
};

/** notionId 単位の上書き（ブロック数・順序は export 準拠） */
const TEXT_OVERRIDE = {
  '12f2e946-a142-4d6b-8e2a-dfb479817f38': `2026年5月時点のメモです。ROS 2 入門シリーズ⑩として、実機がなくても試せる Gazebo 連携の入口を整理します。想定読者は Humble を入れたばかりの方で、ここでは「ros_gz でトピックを橋渡しする」イメージと TurtleBot3 シミュの起動までを押さえます。

Gazebo と ROS 2 をつなぐ層として ros_gz（旧 ros_ign 系）がよく説明されます。パッケージ名はディストリと Gazebo 世代で変わるため、手元では \`apt search ros-humble ros-gz\` と ${LINKS.gazebo}・${LINKS.rosGz} を正にしてください。本記事のコマンド例は ${LINKS.tb3} 向け turtlebot3_gazebo 前提です。

結論として、シミュは物理が簡略化された検証環境です。まず仮想空間でノードとトピックの流れを掴み、⑪の Nav2 へ進む足場にします。シリーズ全体は ${LINKS.seriesRos2} を参照してください。`,
  'bea1348c-ad1a-4ea5-a24c-0699306b21a1': `2026年5月時点。ROS 2 入門の締めとして、自律移動スタック ${LINKS.nav2} を扱います。想定読者は Gazebo シミュまで終えた方で、ここではコンポーネントの並びと TurtleBot3 でよくある起動順を優先します。

Ubuntu 22.04 + ROS 2 Humble 想定です。SLAM 実装（Cartographer / slam_toolbox）や launch 名は環境で差が出るため、手元のパッケージ README と ${LINKS.tb3} が正です。細部パラメータはプロジェクト側の yaml に従ってください。

本記事を読み終えると、地図作成→map_server→Nav2 goal までの流れを説明でき、失敗時に use_sim_time や初期姿勢を疑える状態になります。`,
  '14df0fe9-7cba-4468-b5da-8d853b4f4ddf': `Nav2 はプランナ・コントローラ・コストマップ・行動ツリーなどが協調する自律移動スタックです。全体像は ${LINKS.nav2} の Architecture を参照し、下表は教材としての役割整理です。`,
  '69f6e432-2c3a-4258-98af-c41c6600c76b': `SLAM（Simultaneous Localization and Mapping）は、移動しながら地図を溜めつつ自己位置を推定する処理の総称です。下は Cartographer 系 launch がある前提の例です。apt で入れるパッケージ名は launch と揃え、slam_toolbox と Cartographer を取り違えないでください（${LINKS.tb3}）。`,
  '01d40302-80d9-4d69-955f-952a17921b15': `2026年5月時点。TurtleBot3 × ROS 2 環境構築シリーズ①です。実機を買う前に「何が載っているか」を押さえ、②以降の apt 作業で迷子にならないことが目的です。

モデル一覧・セットアップ・ファーム更新は ${LINKS.tb3} を正と読んでください。ROS 2 ディストリ対応は ${LINKS.humble} で確認します。本記事は整理用メモで、用語の入口と ${LINKS.seriesTb3} への導線を優先します。

結論として、Burger は入門向け、Waffle 系は計算・センサが厚い構成です。ホストPCと RPi4 を同一 Wi-Fi と ROS_DOMAIN_ID で繋ぐ構成を、以降の記事で具体化します。`,
  '5f64f842-894a-4197-869f-591a4574b1a0': `TurtleBot3 は ROBOTIS 社のオープンソース教育・研究用移動ロボットです。ROS / ROS 2 の教材として広く使われ、Gazebo シミュと実機を同じノード構成に近づけられるのが特長です（詳細は ${LINKS.tb3}）。`,
  '8242925d-3467-41e1-aa66-9d96e1ea4091': `ホストPCと TurtleBot3 は同一 Wi-Fi 上で ROS 2 の DDS 通信を共有します。設定の要は ${LINKS.domainId} をホストと RPi4 で一致させることです。`,
  'a0ef59bf-c993-46d7-92fa-9cf24cf34d7c': `2026年5月時点。シリーズ②で、ホストPC（Ubuntu 22.04）に ROS 2 Humble と TurtleBot3 向け apt を載せます。想定読者は①を読み、これから apt で環境を揃える方です。

${LINKS.tb3Quick} や ${LINKS.humble} と重なる手順は短くし、TURTLEBOT3_MODEL・ROS_DOMAIN_ID・TB3 向け apt 束など、公式とズレやすい点を厚めに書きます。

読了後は talker/listener と Gazebo シミュまで再現でき、③の RPi4 セットアップに進める状態を目指します。`,
  '9272f5ed-b55a-4506-9782-cc7ec6fc890b': `2026年5月時点。シリーズ③です。ホストPC 構築のあと、TurtleBot3 本体の Raspberry Pi 4 へ Ubuntu Server 22.04 と ROS 2 Humble を入れます。想定読者は microSD 書き込みから OpenCR ファームまで一気に進めたい方です。

OS 書き込みは ${LINKS.rpiImager}、手順の正本は ${LINKS.tb3} です。Imager の「詳細設定」で SSH・Wi-Fi を事前投入すると、モニター無しで④以降に進みやすくなります。

結論として、64-bit Ubuntu Server が必須で、ホストと同じ ROS_DOMAIN_ID を RPi4 の .bashrc にも書きます。`,
  'b110f13a-39eb-47b5-ba94-ee99a5d85f28': `2026年5月時点。シリーズ④です。RPi4 の Wi-Fi と ROS 2 マルチマシン通信を設定し、ホストPC と TurtleBot3 が同一ネットワークでトピック共有できる状態にします。

netplan・SSH・固定 IP の具体は ${LINKS.networkSsh} に寄せています。本記事は nmcli で Wi-Fi に乗せ、talker/listener で DDS 疎通を見る流れです。自宅／社内など信頼できるセグメントを想定し、WAN 公開 SSH やゼロトラスト設計までは範囲外です。`,
  'b264454c-2af8-4d29-b1ef-32089cef8b67': `ROS 2 は DDS ミドルウェアで同一ネットワーク上のノードが自動発見します。ROS 1 の master 設定は不要です。仕組みの説明は ${LINKS.domainId} を参照してください。`,
  '619ebbd1-d2c9-4a77-8227-abeb6b0ca046': `2026年5月時点。シリーズ⑥です。ネットワーク設定のあと、実機で bringup と teleop_keyboard を動かし、RViz2 で LiDAR を見ます。想定読者は SSH まで終え、初めてモータを回したい方です。

手順の正本は ${LINKS.tb3} の Bringup です。電源順序（OpenCR→RPi4）と ROS_DOMAIN_ID の一致を先に確認すると、/scan が見えないトラブルを減らせます。

読了後はホストPC から /cmd_vel を送り、RViz2 でスキャンが流れるところまで確認できる状態を目指します。`,
  '1b48674d-636e-43f0-afb3-25ee8b0a0c9f': `2026年5月時点。シリーズ⑤です。Raspberry Pi のセットアップ後、ホストPC から SSH で操作できる状態にします。想定読者は「モニターを繋ぎっぱなしにしたくない」「IP が変わって困る」という段階の方です。`,
  '7a13ee6a-6873-4695-8572-3faa71f6ce6d': `よくある状況は次のとおりです。RPi4 のセットアップは終わったが、ホストPC からの操作手順が分からない。IP の確認場所が分からず、毎回ディスプレイを繋いでいる。`,
  'e3fba3da-ddbd-411b-8cf2-0b6d1967fd66': `この記事のゴールは、同一 Wi-Fi 上で SSH を確立し、${LINKS.domainId} を揃えたうえで ros2 topic が見えることです。DDS の詳細な疎通手順は ${LINKS.networkSetup}、本記事は netplan・SSH・固定 IP を担当します。`,
  '369dcac9-7be2-4dc7-afd8-eddc6b13525d': `この記事で押さえること`,
  '8849cadb-0c8d-4a8a-81d4-1df5b832902f': `HostPC と TurtleBot3（Raspberry Pi 4）を同一 Wi-Fi に接続する構成です。有線でも構いませんが、教材では無線が多いです。`,
  '5b66537e-b173-4d21-b862-c354e9fca68b': `ROS 2 は DDS でトピックを共有します。同一サブネットにいるだけで発見される一方、${LINKS.domainId} の不一致は「トピックが見えない」典型原因です。`,
  '6eb13235-04e5-4445-b066-ecc6be6b8bf1': `ROS_DOMAIN_ID はホストPC と TurtleBot3 で同じ整数（0〜101）にしてください。複数人が同じ LAN で ROS 2 を動かす場合は、衝突を避ける値に変えるのが無難です。`,
  'e722f58e-ccbc-4437-b11f-19457abd5c6b': `Ubuntu 22.04 Server では ${LINKS.ubuntuNetplan} でネットワークを管理します。初回だけ HDMI とキーボードを繋ぐか、Imager 事前設定済みなら SSH のみで進められます。`,
  'f18a59c1-825d-4f07-8419-4eb9ea51ac51': `YAML はインデントが構文です。タブではなくスペース2つで揃えてください。インデント崩れは netplan apply で即エラーになります。`,
  '9f170b2e-e7eb-4eec-80f9-8b1fe582b4de': `inet 192.168.x.x の行が出れば Wi-Fi 接続成功です。表示された IP をメモし、SSH の HostName に使います。`,
  '9225cfb7-51cc-4eb3-b743-5bfc9e37750c': `Ubuntu 22.04 Server では openssh-server が入っていることが多いですが、systemctl で有効化を確認します。`,
  '944c2e60-754d-4af9-88cd-c89410760829': `パスワード入力を減らすため、ホストPC から ed25519 鍵で公開鍵認証を設定します。`,
  '94d1a948-cbd2-4734-bc86-3970dd89b698': `設定後は ssh ubuntu@<IP> でパスワード無し接続できることが多いです（権限・sshd_config は環境次第）。`,
  'd47b2b10-ce68-42a1-8986-5f127c59612d': `DHCP だけだと再起動のたびに IP が変わり、SSH の HostName や RViz の設定がずれます。固定 IP または DHCP 予約を推奨します。`,
  'b4dfd30d-ce0d-472a-84b2-54d2188655e2': `教材でも再起動のたびに IP を探し直す負荷は大きいです。ルーターの DHCP 予約が手軽なことが多いです。`,
  '9df0125c-99da-45ee-9304-9f0eb1c3b3a3': `ROS_DOMAIN_ID は DDS の論理セグメントです。HostPC と TurtleBot3 で同じ値が必須です（${LINKS.domainId}）。`,
  'c8740cc4-cafd-4c6a-b21c-e4f503e6ab51': `完了後は、ホストPC のターミナル1つから RPi4 を操作でき、再起動後も IP と ROS_DOMAIN_ID がずれにくい状態を目指します。`,
  'c40933e3-d483-489a-8995-2505da18ebd8': `Gazebo にロボットを出すには URDF（Unified Robot Description Format）でリンク・関節・慣性を定義します。TurtleBot3 実機向けの詳細は ${LINKS.tb3} の Description を参照してください。`,
  '26507441-8eae-41bc-9013-040204909547': `TurtleBot3 は ROS 2 の教材で広く使われるプラットフォームです。シミュ用 launch は ${LINKS.tb3} の Simulation 章が正本です。`,
  '32b5481c-087b-4386-816a-9f5108644cc6': `ホストPC（Ubuntu）では apt で Imager を入れます。Windows / macOS の場合は ${LINKS.rpiImager} から入手してください。`,
  'aba167be-7ce7-4b2d-b35f-b8aea4695845': `Windows や macOS でも ${LINKS.rpiImager} が使えます。書き込み後は RPi4 を LAN に載せ、④⑤の記事で SSH と DDS を確認します。`,
  '6ff47e4c-3a44-470e-ae77-ee3eef1b212a': `bringup は ${LINKS.tb3} どおり、ロボット上のハードウェアノード（LiDAR・オドメ・モータドライバ）を起動する操作です。`,
  'f0566371-3d54-44f8-8d9d-30abc529ad0e': `SSH でログインした RPi4 のシェルで launch を実行します。ホストPC 側は RViz2 や teleop を動かす構成が一般的です。`,
};

const KEEP = new Set(['image', 'divider', 'unsupported', 'code']);

function cleanTone(text) {
  return text
    .replace(/涐載/g, '搭載')
    .replace(/丁寛/g, '丁寧')
    .replace(/Before\s*😓/g, '以前の状態')
    .replace(/After\s*🎉/g, '')
    .replace(/[😓🎉✅😊😅😩💡⚠️]/gu, '')
    .replace(/！/g, '。')
    .replace(/ですね。/g, 'です。')
    .replace(/ですよ。/g, 'です。')
    .replace(/しましょうね。/g, 'します。')
    .replace(/　+/g, ' ')
    .replace(/  +/g, ' ')
    .trim();
}

function rewriteHeading2(slug, text) {
  const m = H2_MAP[slug];
  return m?.[text] ?? text;
}

function hostPcStepKind(slug, block) {
  if (slug !== 'turtlebot3-ros2-host-pc-setup') return block.kind;
  if (block.kind === 'heading_3' && /^\d+-\d+\./.test(block.text)) {
    return 'numbered_list_item';
  }
  return block.kind;
}

function rewriteBlock(slug, block, index, blocks) {
  const out = { ...block };
  if (KEEP.has(block.kind)) return out;

  if (block.kind === 'heading_2') {
    out.text = rewriteHeading2(slug, block.text);
    return out;
  }

  if (TEXT_OVERRIDE[block.notionId]) {
    out.text = TEXT_OVERRIDE[block.notionId];
    return out;
  }

  let text = cleanTone(block.text || '');

  if (block.kind === 'bulleted_list_item' && text.startsWith('✅ ')) {
    text = text.replace(/^✅\s*/, '');
  }

  if (
    slug === 'turtlebot3-ros2-setup-04-network-ssh' &&
    block.kind === 'quote'
  ) {
    if (text === '読み分け（役割分担）') {
      out.text =
        '読み分け: DDS 疎通の詳細は ' +
        LINKS.networkSetup +
        '。本記事は netplan・SSH・固定 IP・ROS_DOMAIN_ID です。';
      return out;
    }
    if (text.startsWith('- 詳細：')) {
      out.text =
        'Wi-Fi と talker/listener による疎通確認 → ' + LINKS.networkSetup;
      return out;
    }
    if (text.startsWith('- 本記事')) {
      out.text =
        '本記事: SSH・netplan・固定 IP、ROS_DOMAIN_ID の一致。同一 LAN 前提（WAN 公開やゼロトラストは組織方針に従ってください）。';
      return out;
    }
    if (text.includes('重複を避ける')) {
      out.text =
        'DDS 手順の重複を避けるため、マルチマシン疎通の深掘りは ' +
        LINKS.networkSetup +
        ' へ寄せています。';
      return out;
    }
    if (text.includes('検証環境')) {
      out.text =
        '検証環境: HostPC Ubuntu 22.04 + ROS 2 Humble / TurtleBot3 RPi4 + Ubuntu 22.04 Server + ROS 2 Humble（2026年5月時点）。';
      return out;
    }
    if (text.includes('~/.ssh/config')) {
      out.text = text.replace('💡', '').trim();
      return out;
    }
  }

  if (block.kind === 'callout' && !text.includes('http')) {
    if (slug.includes('turtlebot3') && text.includes('Ubuntu 22.04')) {
      text += ` 正本: ${LINKS.tb3}。`;
    }
  }

  out.kind = hostPcStepKind(slug, block);
  out.text = text;
  return out;
}

function buildRewrite(exportData) {
  const slug = exportData.slug;
  const blocks = exportData.blocks.map((b, i) =>
    rewriteBlock(slug, b, i, exportData.blocks)
  );

  return {
    pageId: exportData.pageId,
    slug,
    excerpt: EXCERPT_MAP[slug] ?? exportData.excerpt,
    preserveImages: exportData.preserveImages,
    blocks,
  };
}

mkdirSync(rewriteDir, { recursive: true });

for (const slug of SLUGS) {
  const exportPath = join(exportDir, `${slug}.json`);
  const data = JSON.parse(readFileSync(exportPath, 'utf8'));
  const rewrite = buildRewrite(data);
  if (rewrite.blocks.length !== data.blocks.length) {
    throw new Error(`${slug}: block count mismatch`);
  }
  const outPath = join(rewriteDir, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(rewrite, null, 2), 'utf8');
  console.log(`Wrote ${outPath} (${rewrite.blocks.length} blocks)`);
}
