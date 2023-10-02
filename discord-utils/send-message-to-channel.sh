#!/bin/bash

CONTENT=$1
DISCORD_CHANNEL_ID=$2
BOT_TOKEN=$3
URL="https://discord.com/api/v10/channels/$DISCORD_CHANNEL_ID/messages"

echo "content: $CONTENT"

curl -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bot ${BOT_TOKEN}" \
    "$URL" \
    -d @- << EOF
        {
            "content": "$CONTENT",
            "tts": false
        }
EOF
