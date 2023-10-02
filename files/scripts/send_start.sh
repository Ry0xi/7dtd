#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

. "${SCRIPT_DIR}"/utils.sh


check_action() {
	grep "GameServer.Init successful" /mnt/game/log/console/sdtdserver-console.log >& /dev/null
}

while :; do
	check_action && break
	sleep 10
done

post_discord "🖥️🧟‍♂️**サーバー[${SERVERNAME}]の起動が完了しました**🎉\n\n⬇️IPアドレスとポート番号を入力して参加できます⬇️\nIPアドレス: \`${IPADDRESS}\`\nポート番号: \`26900\`\n\n⬇️Steamの場合はこちらから参加できます。⬇️\nURL: \`steam://connect/${IPADDRESS}:26900\`\n※URLを選択してWebで開けば自動でサーバーに接続できます\n\n**⚠️サーバーの接続人数が一定時間0人だった場合、自動的にサーバーを停止します**"
