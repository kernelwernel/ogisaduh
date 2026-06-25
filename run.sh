#!/bin/bash
LOG="/home/kernel/rep/ogisaduh/data/bot.log"
cd "$(dirname "$0")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] building and starting container" >> "$LOG"
docker compose down && docker compose up --build 2>&1 | tee -a "$LOG"
