#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

. "${SCRIPT_DIR}"/utils.sh

FILE=/tmp/check_spot_action_status

check_action() {
	TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600") \
    && RESPONSE=$(curl -s -w "%{http_code}" -H "X-aws-ec2-metadata-token: $TOKEN" -o $FILE http://169.254.169.254/latest/meta-data/spot/instance-action)

    if [ "$RESPONSE" == "200" ]; then
        grep action $FILE && return 0
    else
        return 2
    fi
}

start_shutdown() {
    post_discord "🖥️🧟‍♂️Amazonからスポットインスタンス中断通知を受信しました。\n10秒後にサーバー[${SERVERNAME}]を安全に停止します。"
    sleep 10

	stop_backup_shutdown

    post_discord "🖥️🧟‍♂️サーバー[${SERVERNAME}]を停止しました。"

	/usr/sbin/shutdown -h now
	exit
}

while :; do
	check_action && start_shutdown
	sleep 10
done
