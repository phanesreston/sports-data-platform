import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

def api_get(path):
    req = urllib.request.Request(
        f"https://v3.football.api-sports.io{path}",
        headers={"x-apisports-key": API_KEY}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    if data.get("errors") and data["errors"] != []:
        raise Exception(str(data["errors"]))
    return data["response"]

conn   = mysql.connector.connect(**DB)
cursor = conn.cursor(dictionary=True)

cursor.execute("SELECT id, name FROM teams")
teams = cursor.fetchall()

for i, team in enumerate(teams):
    try:
        rows = api_get(f"/fixtures?season=2026&team={team['id']}")

        for f in rows:
            fix    = f["fixture"]
            league = f["league"]
            home   = f["teams"]["home"]
            away   = f["teams"]["away"]
            goals  = f["goals"]
            score  = f.get("score", {})
            ht     = score.get("halftime", {})
            ft     = score.get("fulltime", {})
            et     = score.get("extratime", {})
            pen    = score.get("penalty", {})

            # Upsert league if missing
            cursor.execute("""
                INSERT INTO leagues (id, name, country_name, logo)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, (league["id"], league["name"], league.get("country"), league.get("logo")))

            # Upsert both teams if missing
            for t in [home, away]:
                cursor.execute("""
                    INSERT INTO teams (id, name, logo, country)
                    VALUES (%s, %s, %s, '')
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                """, (t["id"], t["name"], t.get("logo")))

            # Upsert fixture
            cursor.execute("""
                INSERT INTO fixtures (
                    id, league_id, season, round, referee, date, timestamp,
                    status_short, status_long, status_elapsed,
                    home_team_id, away_team_id,
                    home_goals, away_goals, home_winner, away_winner,
                    ht_home, ht_away, ft_home, ft_away,
                    et_home, et_away, pen_home, pen_away
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,
                    %s,%s,
                    %s,%s,%s,%s,
                    %s,%s,%s,%s,
                    %s,%s,%s,%s
                )
                ON DUPLICATE KEY UPDATE
                    status_short   = VALUES(status_short),
                    status_long    = VALUES(status_long),
                    status_elapsed = VALUES(status_elapsed),
                    home_goals     = VALUES(home_goals),
                    away_goals     = VALUES(away_goals),
                    home_winner    = VALUES(home_winner),
                    away_winner    = VALUES(away_winner),
                    ht_home = VALUES(ht_home), ht_away = VALUES(ht_away),
                    ft_home = VALUES(ft_home), ft_away = VALUES(ft_away),
                    et_home = VALUES(et_home), et_away = VALUES(et_away),
                    pen_home= VALUES(pen_home), pen_away= VALUES(pen_away)
            """, (
                fix["id"], league["id"], league["season"], league.get("round"),
                fix.get("referee"), fix.get("date"), fix.get("timestamp"),
                fix["status"]["short"], fix["status"]["long"], fix["status"].get("elapsed"),
                home["id"], away["id"],
                goals.get("home"), goals.get("away"),
                home.get("winner"), away.get("winner"),
                ht.get("home"), ht.get("away"),
                ft.get("home"), ft.get("away"),
                et.get("home"), et.get("away"),
                pen.get("home"), pen.get("away"),
            ))

        conn.commit()
        print(f"[{team['id']}] {team['name']}: {len(rows)} fixtures")

    except Exception as e:
        print(f"[{team['id']}] {team['name']}: error — {e}")

    if i < len(teams) - 1:
        time.sleep(0.4)

cursor.close()
conn.close()
print("\nDone.")
