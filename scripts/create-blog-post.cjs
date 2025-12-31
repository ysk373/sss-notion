/**
 * Notion APIを使って新規ブログ記事を作成するスクリプト
 */
const { Client } = require('@notionhq/client');
require('dotenv/config');

const notion = new Client({ auth: process.env.NOTION_API_SECRET });
const DATABASE_ID = process.env.DATABASE_ID;

async function createBlogPost() {
	const today = new Date().toISOString().split('T')[0];

	// 記事のメタデータ
	const metadata = {
		title: 'NISA活用でNASDAQへ投資！米国ハイテク株の魅力と始め方',
		slug: 'nasdaq-nisa-investment-guide',
		excerpt: 'NASDAQの魅力とNISA制度を活用した米国株投資の始め方を解説。長期的な資産形成を目指す方に向けた実践的なガイド。',
		tags: ['investment'],
		date: today,
		published: false, // 下書きとして作成
	};

	try {
		// 新規ページを作成
		const response = await notion.pages.create({
			parent: { database_id: DATABASE_ID },
			properties: {
				Page: {
					title: [
						{
							text: {
								content: metadata.title,
							},
						},
					],
				},
				Slug: {
					rich_text: [
						{
							text: {
								content: metadata.slug,
							},
						},
					],
				},
				Excerpt: {
					rich_text: [
						{
							text: {
								content: metadata.excerpt,
							},
						},
					],
				},
				Tags: {
					multi_select: metadata.tags.map((tag) => ({ name: tag })),
				},
				Date: {
					date: {
						start: metadata.date,
					},
				},
				Published: {
					checkbox: metadata.published,
				},
			},
		});

		const pageId = response.id;
		console.log(`✅ ページ作成成功: ${pageId}`);

		// 記事本文のブロックを追加
		await notion.blocks.children.append({
			block_id: pageId,
			children: [
				// はじめに
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{ type: 'text', text: { content: 'はじめに' } }],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'資産形成を考える上で、米国株への投資は外せない選択肢の一つです。特にNASDAQ（ナスダック）には、GAFAMをはじめとする世界を牽引するハイテク企業が名を連ねています。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'そして2024年から始まった新NISA制度により、これまで以上に効率的な資産形成が可能になりました。本記事では、NASDAQの魅力とNISAを活用した投資の始め方について詳しく解説します。',
								},
							},
						],
					},
				},
				// NASDAQとは
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{ type: 'text', text: { content: 'NASDAQとは' } }],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQ（ナスダック）は、米国にある世界最大級の新興企業向け株式市場です。1971年に世界初の電子株式市場として設立され、現在では約3,000社以上の企業が上場しています。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'特徴的なのは、ハイテク・IT関連企業が多く上場していることです。Apple、Microsoft、Amazon、Google（Alphabet）、Meta（旧Facebook）、Tesla、NVIDIAなど、私たちの生活に欠かせないサービスを提供する企業が集まっています。',
								},
							},
						],
					},
				},
				// NASDAQの魅力
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{ type: 'text', text: { content: 'NASDAQの魅力' } }],
					},
				},
				// 1. 世界をリードするハイテク企業が集結
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{
								type: 'text',
								text: { content: '1. 世界をリードするハイテク企業が集結' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQには、時価総額で世界トップクラスの企業が多数上場しています。これらの企業は、クラウドコンピューティング、人工知能（AI）、電気自動車（EV）、半導体など、次世代のテクノロジーをリードしています。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'これらの企業に投資することで、世界経済の成長に直接参加できるのが大きな魅力です。',
								},
							},
						],
					},
				},
				// 2. 高い成長性
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '2. 高い成長性' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'過去の実績を見ると、NASDAQ総合指数は長期的に右肩上がりの成長を続けています。特に2010年代以降は、デジタルトランスフォーメーション（DX）の加速により、ハイテク企業の業績が大きく伸びました。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'もちろん短期的には変動がありますが、10年、20年という長期的視点で見れば、安定した成長が期待できます。',
								},
							},
						],
					},
				},
				// 3. 分散投資の機会
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '3. 分散投資の機会' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQ市場には多様な業種の企業が上場しており、インデックスファンドやETFを通じて効率的に分散投資ができます。一つの企業に集中投資するリスクを避けながら、市場全体の成長を享受できるのです。',
								},
							},
						],
					},
				},
			],
		});

		// 続きのブロックを追加（100ブロック制限があるため分割）
		await notion.blocks.children.append({
			block_id: pageId,
			children: [
				// NISA制度の活用
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [
							{ type: 'text', text: { content: 'NISA制度の活用' } },
						],
					},
				},
				// 新NISAの概要
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '新NISAの概要' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'2024年1月からスタートした新NISA制度は、従来のNISAから大きく進化しました。主なポイントは以下の通りです：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content: '年間投資枠：つみたて投資枠120万円 + 成長投資枠240万円',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: '非課税保有限度額：1,800万円（成長投資枠は1,200万円まで）' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{ type: 'text', text: { content: '非課税保有期間：無期限' } },
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: '売却後の非課税枠の再利用：可能' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'これにより、長期的な資産形成がより効率的に行えるようになりました。',
								},
							},
						],
					},
				},
				// NASDAQ投資とNISAの相性
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{
								type: 'text',
								text: { content: 'NASDAQ投資とNISAの相性' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQへの投資とNISAは非常に相性が良いと言えます。その理由は：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'numbered_list_item',
					numbered_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'長期成長が期待できる：NASDAQのハイテク企業は長期的な成長が見込まれ、NISAの無期限非課税と相性抜群',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'numbered_list_item',
					numbered_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'値上がり益を最大化：株価上昇による利益が非課税になるため、NASDAQ指数の成長を最大限享受できる',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'numbered_list_item',
					numbered_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'積立投資に最適：つみたて投資枠を使えば、ドルコスト平均法で安定的に資産形成できる',
								},
							},
						],
					},
				},
				// 具体的な投資方法
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [
							{ type: 'text', text: { content: '具体的な投資方法' } },
						],
					},
				},
				// 1. インデックスファンド
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{
								type: 'text',
								text: { content: '1. インデックスファンド（つみたて投資枠）' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'初心者に最もおすすめなのが、NASDAQ100指数に連動するインデックスファンドです。代表的な商品として：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: 'eMAXIS NASDAQ100インデックス' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: 'ニッセイNASDAQ100インデックスファンド' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: '楽天・NASDAQ-100インデックス・ファンド' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'これらは信託報酬が低く、つみたて投資枠で毎月コツコツと積み立てるのに適しています。',
								},
							},
						],
					},
				},
			],
		});

		// さらに続きのブロックを追加
		await notion.blocks.children.append({
			block_id: pageId,
			children: [
				// 2. ETF
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{
								type: 'text',
								text: { content: '2. ETF（成長投資枠）' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'より柔軟な投資を求める方には、ETF（上場投資信託）も選択肢です。代表的なNASDAQ関連ETFとして：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'QQQ（Invesco QQQ Trust）：NASDAQ100指数に連動する最も人気のあるETF',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'ONEQ（Fidelity NASDAQ Composite Index ETF）：NASDAQ総合指数に連動',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'ETFは株式と同じようにリアルタイムで売買できるため、タイミングを見て投資したい方に向いています。',
								},
							},
						],
					},
				},
				// 3. 個別株
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{
								type: 'text',
								text: { content: '3. 個別株（成長投資枠）' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'投資経験があり、特定の企業の成長に賭けたい方は、個別株への投資も可能です。人気のNASDAQ銘柄：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: 'Apple（AAPL）：iPhoneなどで知られる世界最大の企業' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'Microsoft（MSFT）：クラウドサービスAzureやOffice製品を展開',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content: 'NVIDIA（NVDA）：AI半導体のリーディングカンパニー',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: 'Amazon（AMZN）：EC・クラウドで圧倒的シェア' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'ただし、個別株は銘柄選択のリスクがあるため、初心者は分散投資が効いたインデックスファンドから始めることをおすすめします。',
								},
							},
						],
					},
				},
				// リスクと注意点
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [
							{ type: 'text', text: { content: 'リスクと注意点' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQへの投資には、以下のようなリスクがあることを理解しておく必要があります：',
								},
							},
						],
					},
				},
				// 1. 為替リスク
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '1. 為替リスク' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'米国株への投資では、ドル円の為替変動の影響を受けます。円高が進むと、株価が上昇していても円換算での利益が減る可能性があります。逆に円安なら利益が増えます。長期投資では為替の変動は平準化される傾向がありますが、理解しておくことが重要です。',
								},
							},
						],
					},
				},
				// 2. 価格変動リスク
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '2. 価格変動リスク' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQは成長性が高い一方で、価格変動も大きい傾向があります。特にハイテク株は金利上昇局面では下落しやすい特性があります。短期的な変動に一喜一憂せず、長期的な視点を持つことが大切です。',
								},
							},
						],
					},
				},
				// 3. 集中リスク
				{
					object: 'block',
					type: 'heading_3',
					heading_3: {
						rich_text: [
							{ type: 'text', text: { content: '3. 集中リスク' } },
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQ100指数は、上位10銘柄で全体の約50%を占めるなど、特定銘柄への集中度が高いです。そのため、一部の大型株の動きに大きく影響を受ける点に注意が必要です。',
								},
							},
						],
					},
				},
			],
		});

		// 最後のブロックを追加
		await notion.blocks.children.append({
			block_id: pageId,
			children: [
				// まとめ
				{
					object: 'block',
					type: 'heading_2',
					heading_2: {
						rich_text: [{ type: 'text', text: { content: 'まとめ' } }],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQは、世界を牽引するハイテク企業が集まる魅力的な投資先です。そして新NISA制度を活用することで、その成長を非課税で享受できます。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'投資を始める際のポイントをまとめると：',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'初心者は、つみたて投資枠でNASDAQ100インデックスファンドから始める',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: '毎月コツコツと積み立て、長期投資を心がける' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: { content: '短期的な変動に惑わされず、10年以上の長期視点を持つ' },
							},
						],
					},
				},
				{
					object: 'block',
					type: 'bulleted_list_item',
					bulleted_list_item: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'慣れてきたら、成長投資枠でETFや個別株にも挑戦してみる',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'NASDAQへの投資は、決して難しいものではありません。新NISA制度という強力なツールを味方につけて、今日から資産形成の第一歩を踏み出してみてはいかがでしょうか。',
								},
							},
						],
					},
				},
				{
					object: 'block',
					type: 'callout',
					callout: {
						rich_text: [
							{
								type: 'text',
								text: {
									content:
										'本記事は投資の参考情報を提供するものであり、特定の金融商品の購入を推奨するものではありません。投資判断はご自身の責任で行ってください。',
								},
							},
						],
						icon: {
							type: 'emoji',
							emoji: '⚠️',
						},
						color: 'yellow_background',
					},
				},
			],
		});

		console.log('✅ 記事本文の追加完了');
		console.log(`\n📝 記事URL: https://www.notion.so/${pageId.replace(/-/g, '')}`);
		console.log('\n💡 Notionで記事を確認して、Publishedチェックボックスをオンにすれば公開されます！');

		return pageId;
	} catch (error) {
		console.error('❌ エラーが発生しました:', error);
		throw error;
	}
}

// スクリプトを実行
createBlogPost();
