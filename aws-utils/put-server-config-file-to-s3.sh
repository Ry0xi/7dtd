#!/bin/bash

upload_file_path=$1
env_file_path=$2
profile=$3

# shellcheck disable=SC1090
source "$env_file_path"

aws s3 cp "$upload_file_path" "s3://$PREFIX/$SERVER_NAME/sdtdserver.xml" --profile "$profile"
