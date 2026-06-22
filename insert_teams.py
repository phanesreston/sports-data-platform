import urllib.request, json, time
import mysql.connector
from config import API_KEY, DB

TEAM_IDS = [
    1532,  # Algeria
    26,    # Argentina
    20,    # Australia
    775,   # Austria
    1,     # Belgium
    1113,  # Bosnia and Herzegovina
    6,     # Brazil
    5529,  # Canada
    1533,  # Cape Verde
    8,     # Colombia
    3,     # Croatia
    5530,  # Curaçao
    770,   # Czech Republic
    1508,  # DR Congo
    2382,  # Ecuador
    32,    # Egypt
    10,    # England
    2,     # France
    25,    # Germany
    1504,  # Ghana
    2386,  # Haiti
    22,    # Iran
    1567,  # Iraq
    1501,  # Ivory Coast
    12,    # Japan
    1548,  # Jordan
    16,    # Mexico
    31,    # Morocco
    1118,  # Netherlands
    4673,  # New Zealand
    1090,  # Norway
    11,    # Panama
    2380,  # Paraguay
    27,    # Portugal
    1569,  # Qatar
    23,    # Saudi Arabia
    1108,  # Scotland
    13,    # Senegal
    1531,  # South Africa
    17,    # South Korea
    9,     # Spain
    5,     # Sweden
    15,    # Switzerland
    28,    # Tunisia
    777,   # Turkey
    2384,  # United States
    7,     # Uruguay
    1568,  # Uzbekistan
]

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
