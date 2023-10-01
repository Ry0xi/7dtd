#!/bin/bash

# 既存のコマンドに対して実行する場合は更新できる
# see: https://discord.com/developers/docs/interactions/application-commands#updating-and-deleting-a-command

env_file=$1
post_json=$2

# shellcheck source=/dev/null
source "$env_file"

echo "url: https://discord.com/api/v10/applications/$DISCORD_APP_ID/commands"

curl -X POST \
    "https://discord.com/api/v10/applications/$DISCORD_APP_ID/commands" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bot $DISCORD_TOKEN" \
    -d "$post_json"
