#!/bin/bash

upload_file_path=$1
env_file_path=$2
server_name=$3
profile=$4

# shellcheck disable=SC1090
source "$env_file_path"

aws s3 cp "$upload_file_path" "s3://$PREFIX/$server_name/sdtdserver.xml" --profile "$profile"
