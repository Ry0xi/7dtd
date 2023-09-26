#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

. "${SCRIPT_DIR}"/utils.sh

post_discord "${SERVERNAME}サーバーの起動処理を始めました。しばらくお待ちください。\nサーバーのIPアドレス: ${IPADDRESS}"
