#!/bin/bash

start_game() {
    echo 'game started.' && \
    docker compose -f /var/lib/config/compose.yaml up -d
}

stop_game() {
    docker compose -f /var/lib/config/compose.yaml down
}