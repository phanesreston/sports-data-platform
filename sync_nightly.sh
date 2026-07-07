#!/bin/bash
# Runs nightly — backfills full team/league data for anything added by sync_fixtures.py
cd /var/www/html

echo "[$(date)] Starting nightly backfill..." >> /var/log/football_sync.log

python3 insert_leagues.py  >> /var/log/football_sync.log 2>&1
python3 insert_teams.py    >> /var/log/football_sync.log 2>&1
python3 sync_fixtures.py   >> /var/log/football_sync.log 2>&1
python3 sync_statistics.py >> /var/log/football_sync.log 2>&1

echo "[$(date)] Nightly backfill complete." >> /var/log/football_sync.log
