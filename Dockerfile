FROM node:20
WORKDIR /app

# 必要なツールをインストール
RUN apt-get update && apt-get install -y git

# package.jsonとlock fileをコピー
COPY package.json package-lock.json ./

# 依存関係をインストール
RUN npm install

# 残りのファイルをコピー（.dockerignoreでnode_modulesなどは除外）
COPY . .

# Astroのテレメトリを無効化
RUN npx astro telemetry disable

# ポートを公開
EXPOSE 4321

# 起動コマンド（コマンドはdocker-composeから上書き可能）
ENTRYPOINT ["npm", "run"]
CMD ["dev"]
