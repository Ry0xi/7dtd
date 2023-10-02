#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

. "${SCRIPT_DIR}"/utils.sh

post_discord "🖥️🧟‍♂️サーバー[${SERVERNAME}]の起動準備を開始します！\nサーバーの起動が完了するまでしばらくお待ちください。\nサーバーのIPアドレス: \`${IPADDRESS}\`"
