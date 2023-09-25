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

start_game() {
    docker-compose -f /var/lib/config/compose.yaml up -d
    echo 'game started.'
}

stop_game() {
    docker-compose -f /var/lib/config/compose.yaml down
}
