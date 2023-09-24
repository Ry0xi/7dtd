# 7 Days to Die Dedicated Server On AWS

7 Days to Dieのマルチプレイサーバーを、AWS上に構築する。

## ロードマップ

- [x] CDKを使って構築する
- [ ] 2023年9月29日金曜日までにマルチプレイができるようにする
- [ ] Discordのコマンドで起動制御できる
- [ ] EC2 Spot Fleetを利用してコストを月1000円以内に抑える

## memo

### 7dtd GameServerの参考
- https://zenn.dev/masahide/articles/ec694906c0c5cd

### Discord Botの参考
- https://note.sarisia.cc/entry/discord-slash-commands/
- https://github.com/masahide/spot-fleet-7dtd/blob/main/functions/discordbot/main.go

Discordbot特有のリクエスト処理とゲームサーバーの操作処理があるので、前者を処理するLambdaから後者を処理するLambdaを呼び出すようにして責務を切り分ける実装になっている。