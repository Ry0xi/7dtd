#!/bin/bash

setup() {
    yum update -y
    yum install -y docker jq expect telnet
    service docker start
    usermod -a -G docker ec2-user

    # Docker Composeのインストール
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    docker-compose version
}

set -ex
setup >/var/tmp/userdata.log 2>&1
set +ex

SERVERNAME=$1
VOLUMESIZE=$2
PREFIX=$3
SNAPSHOTGEN=$4

TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
AZ=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
IPADDRESS=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
INSTANCEID=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
# AZから最後の１文字を削るとリージョン名になる
# shellcheck disable=SC2001
AWS_DEFAULT_REGION=$(echo "${AZ}" | sed -e "s/.$//")

cat <<EOS >/var/tmp/aws_env
export PREFIX=${PREFIX}
export SERVERNAME=${SERVERNAME}
export VOLUMESIZE=${VOLUMESIZE}
export SNAPSHOTGEN=${SNAPSHOTGEN}
export AZ=${AZ}
export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
export INSTANCEID=${INSTANCEID}
export IPADDRESS=${IPADDRESS}
EOS

# shellcheck disable=SC1091
. /var/lib/scripts/utils.sh

set -ex

mount_latest >> /var/tmp/userdata_mount.log 2>&1

/var/lib/scripts/check_spot_action.sh &
/var/lib/scripts/down_cron.sh &
# 起動
start_game
