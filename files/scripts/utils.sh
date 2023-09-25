#!/bin/bash

start_game() {
    docker-compose -f /var/lib/config/compose.yaml up -d
    echo 'game started.'
}

stop_game() {
    docker-compose -f /var/lib/config/compose.yaml down
}
