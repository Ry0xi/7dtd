#!/bin/bash

# shellcheck disable=SC1091
. /var/tmp/aws_env

# インスタンスのスナップショットを取得する
_get_snapshot() {
    snapshots=$(aws ec2 describe-snapshots --owner-ids self \
        --query 'Snapshots[?(Tags[?Key==`'"$SERVERNAME"'`].Value)]')
    latestsnapshot=$(echo "$snapshots" | jq 'max_by(.StartTime)|.SnapshotId' -r)

    echo "$latestsnapshot"
}

# スナップショットをインスタンスにマウントする
_mount_snapshot() {
	snapshot=$1
    aws ec2 wait snapshot-completed --snapshot-ids "$snapshot"
	time=$(date "+%Y%m%d-%H%M%S")
	volume=$(aws ec2 create-volume --volume-type gp3 \
		--availability-zone "$AZ" \
		--snapshot-id "$snapshot" \
		--tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value='"${SERVERNAME}"-"${time}"'},{Key='"$SERVERNAME"',Value=true}]')
	vid=$(echo "$volume" | jq -r '.VolumeId')
	echo "$vid" >/var/tmp/aws_vid
	echo volumeID: "$vid"

	aws ec2 wait volume-available --volume-ids "$vid"
	aws ec2 attach-volume --volume-id "$vid" --instance-id "$INSTANCEID" --device /dev/sdf
	sleep 5
	mount /dev/sdf /mnt
}

# ボリュームを新規作成してマウントする
_create_new_volume() {
    time=$(date "+%Y%m%d-%H%M%S")
    createvolume=$(aws ec2 create-volume --volume-type gp3 \
        --size "$VOLUMESIZE" \
        --availability-zone "$AZ" \
        --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value='"${SERVERNAME}"-"${time}"'},{Key='"$SERVERNAME"',Value=true}]')
    vid=$(echo "$createvolume" | jq -r '.VolumeId')
    echo "$vid" >/var/tmp/aws_vid
    echo volumeID: "$vid"
    aws ec2 wait volume-available --volume-ids "$vid"
    aws ec2 attach-volume --volume-id "$vid" --instance-id "$INSTANCEID" --device /dev/sdf
    sleep 5
    sudo mkfs.xfs /dev/sdf
    mount /dev/sdf /mnt
}

# Delete old ones, leaving $SNAPSHOTGEN generations
_delete_old_snapshot() {
	snapshots=$(aws ec2 describe-snapshots --owner-ids self \
		--query 'Snapshots[?(Tags[?Key==`'"$SERVERNAME"'`].Value)]')
	rmsids=$(echo "$snapshots" | jq 'sort_by(.StartTime)|.[:-'"$SNAPSHOTGEN"']|.[].SnapshotId' -r)
	for sid in $rmsids; do
		aws ec2 delete-snapshot --snapshot-id "$sid"
	done
}

get_ssm_value() {
	SSMPATH=/${PREFIX}/${SERVERNAME}
	aws ssm get-parameter --name "$SSMPATH/$1" --with-decryption | jq .Parameter.Value -r
}

mount_latest() {
	snapshot=$(_get_snapshot)
	case "$snapshot" in
	"null")
		_create_new_volume
		;;
	*)
		_mount_snapshot "$snapshot"
		;;
	esac
}

# マウントを解除し、スナップショットを作成、ボリュームを削除する
create_snapshot() {
	vid=$(cat /var/tmp/aws_vid)
	## マウント解除
	umount -f /mnt
	aws ec2 detach-volume --volume-id "$vid"

	## スナップショット作成
	time=$(date "+%Y%m%d-%H%M%S")
	aws ec2 create-snapshot --volume-id "$vid" \
		--description "$SERVERNAME backup $time" \
		--tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value='"${SERVERNAME}"-"${time}"'},{Key='"$SERVERNAME"',Value=true}]'

	sleep 2

	## ボリューム削除
	aws ec2 wait volume-available --volume-ids "$vid"
	aws ec2 delete-volume --volume-id "$vid"
	_delete_old_snapshot
}

stop_server() {
    [[ -z $PREFIX ]] && return
	sfrid=$(get_ssm_value sfrID)
	aws ec2 modify-spot-fleet-request --spot-fleet-request-id "$sfrid" --target-capacity 0
}

start_game() {
    # メンテナンスモードの場合はスタートしない
    if [[ $(get_ssm_value maintenance) == true ]]; then
        echo 'maintenance mode.' && return
    fi

    docker-compose -f /var/lib/config/compose.yaml up -d
    echo 'game started.'
}

stop_game() {
    docker-compose -f /var/lib/config/compose.yaml down
}

# usage(in): switch_maintenance "true"
# usage(out): switch_maintenance "false"
switch_maintenance() {
    [[ -z $PREFIX ]] && return
    [[ $SERVERNAME == "" ]] && SERVERNAME=$2
	[[ $SERVERNAME == "" ]] && return
    aws ssm put-parameter --name "/$PREFIX/$SERVERNAME/maintenance" --type "String" --value "$1" --overwrite
}

stop_backup_shutdown() {
	stop_game
	sleep 3
	create_snapshot
	sleep 3
	stop_server
}

post_discord() {
    # メンテナンスモードのときは返信しない
    [[ $(get_ssm_value maintenance) == true ]] && return

    DISCORD_CHANNEL_ID=$(get_ssm_value discordChannelId)
	BOT_TOKEN=$(get_ssm_value discordBotToken)
	URL="https://discord.com/api/v10/channels/$DISCORD_CHANNEL_ID/messages"

    curl -X POST -H "Content-Type: application/json" \
        -H "Authorization: Bot ${BOT_TOKEN}" \
        "$URL" \
        -d @- << EOF
            {
                "content": "$1",
                "tts": false
            }
EOF
}
