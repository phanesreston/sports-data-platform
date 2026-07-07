import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

SEASON = 2026

def api_get(path):
    req = urllib.request.Request(
        f"https://v3.football.api-sports.io{path}",
        headers={"x-apisports-key": API_KEY}
    )
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read())
    if data.get("errors") and data["errors"] != []:
        raise Exception(str(data["errors"]))
    return data

def upsert_player(cursor, p):
    cursor.execute("""
        INSERT INTO players (id, name, firstname, lastname, age, nationality, height, weight, photo, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            name        = VALUES(name),
            age         = VALUES(age),
            nationality = VALUES(nationality),
            height      = VALUES(height),
            weight      = VALUES(weight),
            photo       = VALUES(photo),
            updated_at  = VALUES(updated_at)
    """, (
        p["id"], p["name"], p.get("firstname"), p.get("lastname"),
        p.get("age"), p.get("nationality"), p.get("height"), p.get("weight"),
        p.get("photo"), int(time.time() * 1000),
    ))

def upsert_stats(cursor, player_id, team_id, s):
    g  = s.get("games",     {})
    gl = s.get("goals",     {})
    sh = s.get("shots",     {})
    pa = s.get("passes",    {})
    ta = s.get("tackles",   {})
    du = s.get("duels",     {})
    dr = s.get("dribbles",  {})
    fo = s.get("fouls",     {})
    ca = s.get("cards",     {})
    pe = s.get("penalty",   {})
    league_id = s.get("league", {}).get("id")
    season    = s.get("league", {}).get("season")

    rating_raw = g.get("rating")
    rating = float(rating_raw) if rating_raw else None

    cursor.execute("""
        INSERT INTO player_stats (
            player_id, team_id, league_id, season,
            position, rating, captain, appearances, lineups, minutes,
            goals, assists, saves, conceded,
            shots_total, shots_on,
            passes_total, passes_key, passes_accuracy,
            tackles_total, blocks, interceptions,
            duels_total, duels_won,
            dribbles_attempts, dribbles_success,
            fouls_drawn, fouls_committed,
            yellow_cards, yellowred_cards, red_cards,
            penalty_won, penalty_committed, penalty_scored, penalty_missed, penalty_saved
        ) VALUES (
            %s,%s,%s,%s,
            %s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,
            %s,%s,
            %s,%s,%s,
            %s,%s,%s,
            %s,%s,
            %s,%s,
            %s,%s,
            %s,%s,%s,
            %s,%s,%s,%s,%s
        )
        ON DUPLICATE KEY UPDATE
            position          = VALUES(position),
            rating            = VALUES(rating),
            appearances       = VALUES(appearances),
            lineups           = VALUES(lineups),
            minutes           = VALUES(minutes),
            goals             = VALUES(goals),
            assists           = VALUES(assists),
            saves             = VALUES(saves),
            shots_total       = VALUES(shots_total),
            shots_on          = VALUES(shots_on),
            passes_total      = VALUES(passes_total),
            passes_key        = VALUES(passes_key),
            passes_accuracy   = VALUES(passes_accuracy),
            tackles_total     = VALUES(tackles_total),
            blocks            = VALUES(blocks),
            interceptions     = VALUES(interceptions),
            duels_total       = VALUES(duels_total),
            duels_won         = VALUES(duels_won),
            dribbles_attempts = VALUES(dribbles_attempts),
            dribbles_success  = VALUES(dribbles_success),
            fouls_drawn       = VALUES(fouls_drawn),
            fouls_committed   = VALUES(fouls_committed),
            yellow_cards      = VALUES(yellow_cards),
            yellowred_cards   = VALUES(yellowred_cards),
            red_cards         = VALUES(red_cards)
    """, (
        player_id, team_id, league_id, season,
        g.get("position"), rating, g.get("captain", False),
        g.get("appearences"), g.get("lineups"), g.get("minutes"),
        gl.get("total"), gl.get("assists"), gl.get("saves"), gl.get("conceded"),
        sh.get("total"), sh.get("on"),
        pa.get("total"), pa.get("key"), pa.get("accuracy"),
        ta.get("total"), ta.get("blocks"), ta.get("interceptions"),
        du.get("total"), du.get("won"),
        dr.get("attempts"), dr.get("success"),
        fo.get("drawn"), fo.get("committed"),
        ca.get("yellow"), ca.get("yellowred"), ca.get("red"),
        pe.get("won"), pe.get("commited"), pe.get("scored"), pe.get("missed"), pe.get("saved"),
    ))

# ── main ──────────────────────────────────────────────────────────────────────

conn   = mysql.connector.connect(**DB)
cursor = conn.cursor(dictionary=True)

cursor.execute("SELECT id, name FROM teams ORDER BY id")
teams = cursor.fetchall()
print(f"Fetching players for {len(teams)} teams (season {SEASON})...")

call_count = 0

for i, team in enumerate(teams):
    try:
        page        = 1
        total_pages = 1
        count       = 0

        while page <= total_pages:
            if call_count > 0:
                time.sleep(0.7)

            data        = api_get(f"/players?team={team['id']}&season={SEASON}&page={page}")
            total_pages = data.get("paging", {}).get("total", 1)
            call_count += 1

            for entry in data.get("response", []):
                p    = entry["player"]
                stats = entry.get("statistics", [])

                upsert_player(cursor, p)

                cursor.execute("""
                    INSERT IGNORE INTO team_players (team_id, player_id, season)
                    VALUES (%s, %s, %s)
                """, (team["id"], p["id"], SEASON))

                for s in stats:
                    t_id = s.get("team", {}).get("id")
                    if t_id:
                        upsert_stats(cursor, p["id"], t_id, s)

                count += 1

            page += 1

        conn.commit()
        print(f"[{team['id']}] {team['name']}: {count} players ({total_pages} page(s))")

    except Exception as e:
        print(f"[{team['id']}] {team['name']}: error — {e}")

cursor.close()
conn.close()
print(f"\nDone. ({call_count} API calls)")
