#!/bin/bash

function_name=$1
profile=$2
# ファイルインプットならpwdからの相対パス
post_json=$3

function_url=$(aws lambda get-function-url-config --function-name "$function_name" --profile "$profile" | jq -r '.FunctionUrl')

echo "function_url: $function_url"

curl -X POST \
      "$function_url" \
      -H 'Content-Type: application/json' \
      -d "$post_json"
