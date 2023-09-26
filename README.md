# 7 Days to Die Dedicated Server On AWS

7 Days to Dieのマルチプレイサーバーを、AWS上に構築する。

## ロードマップ

- [x] CDKを使って構築する
- [ ] 2023年9月29日金曜日までにマルチプレイができるようにする
- [ ] Discordのコマンドで起動できる
- [ ] サーバー停止機能(自動)
- [ ] データ永続化(バックアップ)
- [ ] Discord通知
  - steam用URL & IP,Port
- [x] EC2 Spot Fleetを利用する
- [ ] コストを月1000円以内に抑える

## 開発環境

### Prerequisite

#### Bun

```sh
curl -fsSL https://bun.sh/install | bash
```

```sh
bun install
```

```sh
bun run hoge
```

### ディレクトリ構造
- cdk: CDK関連
  - bin/cdk.ts: CDKのメイン
  - lib/*-stack.ts: スタックの設定
- files: EC2上で利用するスクリプトなど
- functions: Lambda関連

### CDKのデプロイ

```sh
cdk deploy --all
```

### サーバーの起動・停止
- EC2 Spot FleetでEC2インスタンスの条件を指定
- Spot Fleetのターゲットキャパシティを増減させることによってサーバーの起動停止を行う

#### CLIでサーバーの起動・停止

https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/work-with-spot-fleets.html#modify-spot-fleet

起動

```sh
aws ec2 modify-spot-fleet-request --spot-fleet-request-id sfr-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx --target-capacity 1
```

停止

```sh
aws ec2 modify-spot-fleet-request --spot-fleet-request-id sfr-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx --target-capacity 0
```

## memo

### 7dtd GameServerの参考
- https://zenn.dev/masahide/articles/ec694906c0c5cd

### Discord Botの参考
- https://note.sarisia.cc/entry/discord-slash-commands/
- https://github.com/masahide/spot-fleet-7dtd/blob/main/functions/discordbot/main.go

Discordbot特有のリクエスト処理とゲームサーバーの操作処理があるので、前者を処理するLambdaから後者を処理するLambdaを呼び出すようにして責務を切り分ける実装になっている。
