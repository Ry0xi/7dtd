#!/usr/bin/expect

set timeout 5
spawn docker exec -it 7dtdserver telnet localhost 8081
send "listplayers\r"
expect -re "in the game"
send "exit\r"

expect eof
