import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

def fetch_team(team_id):
    req = urllib.request.Request(
        f"https://v3.football.api-sports.io/teams?id={team_id}",
        headers={"x-apisports-key": API_KEY}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    if data.get("errors"):
        raise Exception(f"API error: {data['errors']}")
    return data["response"][0] if data["response"] else None

def upsert_team(cursor, team, venue):
    cursor.execute("""
        INSERT INTO teams (id, name, code, country, founded, national, logo)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name     = VALUES(name),
            code     = VALUES(code),
            country  = VALUES(country),
            founded  = VALUES(founded),
            national = VALUES(national),
            logo     = VALUES(logo)
    """, (
        team["id"],
        team["name"],
        team.get("code"),
        team.get("country"),
        team.get("founded"),
        team.get("national", False),
        team.get("logo"),
    ))

    if venue and venue.get("id"):
        cursor.execute("""
            INSERT INTO venues (id, team_id, name, address, city, capacity, surface, image)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name     = VALUES(name),
                address  = VALUES(address),
                city     = VALUES(city),
                capacity = VALUES(capacity),
                surface  = VALUES(surface),
                image    = VALUES(image)
        """, (
            venue["id"],
            team["id"],
            venue.get("name"),
            venue.get("address"),
            venue.get("city"),
            venue.get("capacity"),
            venue.get("surface"),
            venue.get("image"),
        ))

conn   = mysql.connector.connect(**DB)
cursor = conn.cursor()

# Fetch all team IDs from the DB — includes any added by sync_fixtures.py
cursor.execute("SELECT id FROM teams ORDER BY id")
TEAM_IDS = [row[0] for row in cursor.fetchall()]
print(f"{len(TEAM_IDS)} teams to update")

for i, team_id in enumerate(TEAM_IDS):
    try:
        result = fetch_team(team_id)
        if not result:
            print(f"[{team_id}] no data returned")
            continue
        upsert_team(cursor, result["team"], result.get("venue"))
        conn.commit()
        print(f"[{team_id}] {result['team']['name']} ✓")
    except Exception as e:
        print(f"[{team_id}] error — {e}")

    if i < len(TEAM_IDS) - 1:
        time.sleep(0.4)

cursor.close()
conn.close()
print("\nDone.")
