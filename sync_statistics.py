import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

STAT_FIELDS = {
    "Shots on Goal":     "shots_on_goal",
    "Shots off Goal":    "shots_off_goal",
    "Total Shots":       "total_shots",
    "Blocked Shots":     "blocked_shots",
    "Shots insidebox":   "shots_insidebox",
    "Shots outsidebox":  "shots_outsidebox",
    "Fouls":             "fouls",
    "Corner Kicks":      "corner_kicks",
    "Offsides":          "offsides",
    "Ball Possession":   "ball_possession",
    "Yellow Cards":      "yellow_cards",
    "Red Cards":         "red_cards",
    "Goalkeeper Saves":  "goalkeeper_saves",
    "Total passes":      "total_passes",
    "Passes accurate":   "passes_accurate",
    "Passes %":          "passes_pct",
    "expected_goals":    "expected_goals",
    "goals_prevented":   "goals_prevented",
}

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

# Only fetch stats for finished fixtures not yet in DB
cursor.execute("""
    SELECT id FROM fixtures
    WHERE status_short IN ('FT','AET','PEN')
    AND id NOT IN (SELECT DISTINCT fixture_id FROM fixture_statistics)
""")
fixtures = cursor.fetchall()
print(f"{len(fixtures)} fixtures need statistics")

for i, row in enumerate(fixtures):
    fid = row["id"]
    try:
        results = api_get(f"/fixtures/statistics?fixture={fid}")

        for team_data in results:
            team_id = team_data["team"]["id"]
            stats   = { s["type"]: s["value"] for s in team_data["statistics"] }

            values = { col: stats.get(api_key) for api_key, col in STAT_FIELDS.items() }

            cursor.execute("""
                INSERT INTO fixture_statistics (
                    fixture_id, team_id,
                    shots_on_goal, shots_off_goal, total_shots, blocked_shots,
                    shots_insidebox, shots_outsidebox, fouls, corner_kicks,
                    offsides, ball_possession, yellow_cards, red_cards,
                    goalkeeper_saves, total_passes, passes_accurate, passes_pct,
                    expected_goals, goals_prevented
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON DUPLICATE KEY UPDATE
                    shots_on_goal    = VALUES(shots_on_goal),
                    shots_off_goal   = VALUES(shots_off_goal),
                    total_shots      = VALUES(total_shots),
                    fouls            = VALUES(fouls),
                    ball_possession  = VALUES(ball_possession),
                    yellow_cards     = VALUES(yellow_cards),
                    red_cards        = VALUES(red_cards),
                    expected_goals   = VALUES(expected_goals),
                    goals_prevented  = VALUES(goals_prevented)
            """, (
                fid, team_id,
                values["shots_on_goal"], values["shots_off_goal"], values["total_shots"], values["blocked_shots"],
                values["shots_insidebox"], values["shots_outsidebox"], values["fouls"], values["corner_kicks"],
                values["offsides"], values["ball_possession"], values["yellow_cards"], values["red_cards"],
                values["goalkeeper_saves"], values["total_passes"], values["passes_accurate"], values["passes_pct"],
                values["expected_goals"], values["goals_prevented"],
            ))

        conn.commit()
        print(f"[{fid}] stats for {len(results)} teams ✓")

    except Exception as e:
        print(f"[{fid}] error — {e}")

    if i < len(fixtures) - 1:
        time.sleep(0.4)

cursor.close()
conn.close()
print("\nDone.")
