import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

LEAGUE_IDS = [
    1,    # FIFA World Cup
    2,    # UEFA Champions League
    3,    # UEFA Europa League
    39,   # Premier League
    140,  # La Liga
    135,  # Serie A
    78,   # Bundesliga
    61,   # Ligue 1
]

def fetch_league(league_id):
    req = urllib.request.Request(
        f"https://v3.football.api-sports.io/leagues?id={league_id}",
        headers={"x-apisports-key": API_KEY}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    if data.get("errors"):
        raise Exception(f"API error: {data['errors']}")
    return data["response"][0] if data["response"] else None

def upsert_league(cursor, result):
    league  = result["league"]
    country = result.get("country", {})
    seasons = result.get("seasons", [])

    cursor.execute("""
        INSERT INTO leagues (id, name, type, logo, country_name, country_code, country_flag)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name         = VALUES(name),
            type         = VALUES(type),
            logo         = VALUES(logo),
            country_name = VALUES(country_name),
            country_code = VALUES(country_code),
            country_flag = VALUES(country_flag)
    """, (
        league["id"],
        league["name"],
        league.get("type"),
        league.get("logo"),
        country.get("name"),
        country.get("code"),
        country.get("flag"),
    ))

    for season in seasons:
        cursor.execute("""
            INSERT INTO league_seasons (league_id, year, start_date, end_date, current_season)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                start_date     = VALUES(start_date),
                end_date       = VALUES(end_date),
                current_season = VALUES(current_season)
        """, (
            league["id"],
            season["year"],
            season.get("start") or None,
            season.get("end")   or None,
            season.get("current", False),
        ))

conn   = mysql.connector.connect(**DB)
cursor = conn.cursor()

for i, league_id in enumerate(LEAGUE_IDS):
    try:
        result = fetch_league(league_id)
        if not result:
            print(f"[{league_id}] no data returned")
            continue
        upsert_league(cursor, result)
        conn.commit()
        print(f"[{league_id}] {result['league']['name']} ✓  ({len(result.get('seasons', []))} seasons)")
    except Exception as e:
        print(f"[{league_id}] error — {e}")

    if i < len(LEAGUE_IDS) - 1:
        time.sleep(0.4)

cursor.close()
conn.close()
print("\nDone.")
