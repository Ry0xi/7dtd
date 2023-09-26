#!/bin/bash

# STARTWAIT=1800
# WAIT=300
STARTWAIT=1500
WAIT=60

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
	# [[ $user == "" ]] && user=99
	[[ $user == "" ]] && user=0
	echo "$user"
}


check_action() {
	[[ "$(players)" -eq "0" ]]
}

sleep $STARTWAIT

while :; do
	sleep $WAIT
	check_action || continue
	echo 1..
	sleep $WAIT
	check_action  || continue
	echo 2..
	sleep $WAIT
	check_action  || continue
	break
done

stop_backup_shutdown

/usr/sbin/shutdown -h now
