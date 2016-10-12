#!/bin/bash
#fuser -k 8080/tcp
lsof -i tcp:8080 | tail -n 1 | awk '{print $2}' | xargs kill -9
python server.py
