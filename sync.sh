#!/bin/bash
cd /var/www/html

echo "[$(date)] Starting sync..." >> /var/log/football_sync.log

python3 sync_fixtures.py   >> /var/log/football_sync.log 2>&1
python3 sync_statistics.py >> /var/log/football_sync.log 2>&1

echo "[$(date)] Sync complete." >> /var/log/football_sync.log
