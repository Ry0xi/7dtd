#!/bin/bash

setup() {
    yum update -y
    yum install -y docker
    service docker start
    usermod -a -G docker ec2-user

    # Docker Composeのインストール
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
}

set -ex
setup >/var/tmp/userdata.log 2>&1
set +ex

TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
IPADDRESS=$(curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

cat <<EOS >/var/tmp/aws_env
exportIPADDRESS=${IPADDRESS}
EOS

. /var/lib/scripts/utils.sh
set -x

# 起動
echo 'beforeStartGame:'
start_game
echo 'afterStartGame:'