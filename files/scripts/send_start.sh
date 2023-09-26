#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

. "${SCRIPT_DIR}"/utils.sh


check_action() {
	grep "GameServer.Init successful" /mnt/game/log/console/sdtdserver-console.log || false
}

while :; do
	check_action && break
	sleep 10
done

output_log "${SERVERNAME}サーバーの起動が完了しました！\nゲームが始められます。\nSteamの場合はこちらから参加できます。\nURL: steam://connect/${IPADDRESS}:26900\n他の場合はIPアドレスとポート番号を入力して参加できます。\nIPアドレス: ${IPADDRESS}\nポート番号: 26900"
