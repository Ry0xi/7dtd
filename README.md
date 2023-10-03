# 7 Days to Die Dedicated Server On AWS

7 Days to Dieのマルチプレイサーバーを、AWS上に構築する。

## Links

- [インストールガイド](./doc/INSTALLATION.md)
- [残タスク](./doc/TASKS.md)

## Directories

- cdk: CDK関連
  - bin/cdk.ts: CDKのメイン
  - lib/\*-stack.ts: スタックの設定
- files: EC2上で利用するスクリプトなど
- functions: Lambda関連

## Usage

### 初期設定

```sh
bun install
```

事前に[インストールガイド](./doc/INSTALLATION.md)を参考に、必要なツールをインストールしてください。

### コードフォーマット

コードの修正

```sh
bun run fix
```

コードの確認のみ

```sh
bun run check
```

[SHOULD] エディターの保存時の設定でPrettierとESLintを実行するのを推奨します。

### デプロイ

cdkディレクトリでcdkコマンドを実行します。

```sh
cd ./cdk && cdk deploy --all
```

デプロイ前にLambda関数の依存関係をインストールする必要があります。

```sh
cd ./functions && npm i
```

### デバッグ

- [EC2でデバッグする際のコマンド](./doc/EC2_DEBUG_COMMANDS.md)

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

### サーバー設定ファイルの更新

サーバーの設定を変えるにはEC2インスタンス上の`/mnt/game/ServerFiles/sdtdserver.xml`を更新します。

設定ファイルは手動更新せずにS3に保管して、それをサーバーから取得します。（自動化はしていない）

1. プロジェクトルートに、現バージョンのデフォルト設定ファイル(`sdtdserver-default.xml`)があるので、任意の場所にXMLファイルとしてコピー
1. 1で作成したファイルで設定を変えて保存
1. `./discord-utils/put-server-config-file-to-s3.sh`を実行してS3に設定ファイルをアップロード（コマンドの引数はスクリプトファイルを参照）
1. EC2インスタンスにSSHで接続して、`/var/lib/scripts/utils.sh`の`update_server_config`を実行する
1. ゲームサーバーを再起動（Dockerコンテナを再度立ち上げる）

## memo

### 7dtd GameServerの参考

- https://zenn.dev/masahide/articles/ec694906c0c5cd

### Discord Botの参考

- https://note.sarisia.cc/entry/discord-slash-commands/
- https://github.com/masahide/spot-fleet-7dtd/blob/main/functions/discordbot/main.go

Discordbot特有のリクエスト処理とゲームサーバーの操作処理があるので、前者を処理するLambdaから後者を処理するLambdaを呼び出すようにして責務を切り分ける実装になっている。
