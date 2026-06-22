# Football Database

PHP/MySQL World Cup 2026 tracker running on Apache.

## First-time setup on server

**1. Create your config files** (these are gitignored and never committed):

```bash
cp config.example.php config.php
cp config.example.py config.py
```

Edit both files and fill in your DB password and API Sports key.

**2. Install Python dependency:**

```bash
pip install mysql-connector-python
```

**3. Populate the database:**

```bash
python3 insert_leagues.py   # league metadata
python3 insert_teams.py     # World Cup team profiles
python3 sync_fixtures.py    # fixtures for each team
python3 sync_statistics.py  # match stats (finished games only)
```

## Day-to-day workflow

Edit files here, commit, then on the server:

```bash
git pull
```

`config.php` and `config.py` are gitignored so they're never touched by a pull.

## Re-syncing data

Run these any time to pick up new results/fixtures:

```bash
python3 sync_fixtures.py    # updates scores and status
python3 sync_statistics.py  # adds stats for newly finished games
```
