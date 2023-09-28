#!/bin/bash

STARTWAIT=1800
WAIT=300

# shellcheck disable=SC1091
. /var/tmp/aws_env

SCRIPT_DIR=$(
	cd "$(dirname "$0")" || exit
	pwd
)

# shellcheck disable=SC1091
. "${SCRIPT_DIR}"/utils.sh

FILE=/tmp/players

players() {
	"${SCRIPT_DIR}"/expect/list_players.sh > $FILE
	user=$(cat $FILE | grep "in the game" | grep -Eo "[0-9]{1,4}")
	[[ $user == "" ]] && user=99
	echo "$user"
}


check_action() {
	[[ "$(players)" -eq "0" ]]
}

echo '------------start_wait_start------------'

sleep $STARTWAIT

echo '------------start_wait_end------------'

while :; do
	sleep $WAIT
	check_action || continue
	echo 'after_wait_1'

	sleep $WAIT
	check_action  || continue
	echo 'after_wait_2'

	sleep $WAIT
	check_action  || continue
	break
done

post_discord "${SERVERNAME}サーバーを停止しました。"

stop_backup_shutdown

/usr/sbin/shutdown -h now
