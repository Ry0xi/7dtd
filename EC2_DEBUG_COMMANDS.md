# EC2でデバッグする際のコマンドメモ

## UserData Scriptのログ確認

ルート権限に変更

```sh
sudo su
```

cloud-initのログ確認

```sh
tail -f /var/log/cloud-init-output.log
```

```sh
vi /var/log/cloud-init-output.log
```

setup部分のコンソール出力ログ確認（カスタムログファイル）

```sh
vi /var/tmp/userdata.log
```

## EBSボリュームのマウント処理のログ確認

カスタムログファイル

```sh
vi /var/tmp/userdata_mount.log
```

## スクリプトで利用する環境変数の確認

カスタムファイル

```sh
vi /var/tmp/aws_env
```

## 7 Days to Dieゲームサーバーログの確認

dockerコマンドでリアルタイム確認

```sh
docker logs -f 7dtdserver -t
```

ログ確認

```sh
vi /mnt/game/log/console/sdtdserver-console.log
```

ゲームサーバー起動確認(出力があれば起動済み)

```sh
cat /mnt/game/log/console/sdtdserver-console.log | grep "GameServer.Init successful"
```

## ゲームサーバーの接続人数の確認

サーバー停止バッチによって作成されるカスタムログファイル

```sh
vi /tmp/players
```
