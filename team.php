<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$id = intval($_GET['id'] ?? 0);
if (!$id) { header("Location: index.php"); exit; }

$stmt = $conn->prepare("SELECT * FROM teams WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$team = $stmt->get_result()->fetch_assoc();
if (!$team) { echo "Team not found."; exit; }

$stmt2 = $conn->prepare("SELECT * FROM venues WHERE team_id = ?");
$stmt2->bind_param("i", $id);
$stmt2->execute();
$venue = $stmt2->get_result()->fetch_assoc();

$stmt3 = $conn->prepare("
    SELECT
        f.id, f.date, f.round, f.status_short,
        f.home_goals, f.away_goals,
        f.home_team_id, f.away_team_id,
        ht.name AS home_name, ht.logo AS home_logo,
        at.name AS away_name, at.logo AS away_logo,
        l.name AS league_name, l.logo AS league_logo
    FROM fixtures f
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    LEFT JOIN leagues l ON l.id = f.league_id
    WHERE (f.home_team_id = ? OR f.away_team_id = ?)
    AND f.season = 2026
    ORDER BY f.date DESC
");
$stmt3->bind_param("ii", $id, $id);
$stmt3->execute();
$fixtures = $stmt3->get_result()->fetch_all(MYSQLI_ASSOC);

// Compute season record from completed fixtures
$stat_played = $stat_won = $stat_drawn = $stat_lost = $stat_gf = $stat_ga = 0;
foreach ($fixtures as $f) {
    if (!in_array($f['status_short'], ['FT', 'AET', 'PEN'])) continue;
    $is_home    = ($f['home_team_id'] == $id);
    $team_goals = $is_home ? $f['home_goals'] : $f['away_goals'];
    $opp_goals  = $is_home ? $f['away_goals'] : $f['home_goals'];
    $stat_played++;
    $stat_gf += $team_goals;
    $stat_ga += $opp_goals;
    if ($team_goals > $opp_goals)     $stat_won++;
    elseif ($team_goals < $opp_goals) $stat_lost++;
    else                              $stat_drawn++;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?= htmlspecialchars($team['name']) ?></title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; }

        .navbar { background: #111; color: white; display: flex; align-items: center; padding: 0 24px; height: 54px; gap: 32px; }
        .nav-brand { font-size: 1rem; font-weight: 800; color: white; text-decoration: none; }
        .nav-links { display: flex; gap: 4px; }
        .nav-links a { color: #aaa; text-decoration: none; font-size: 14px; font-weight: 600; padding: 6px 14px; border-radius: 6px; }
        .nav-links a:hover { color: white; background: #222; }

        .breadcrumb { background: white; border-bottom: 1px solid #e8e8e8; padding: 10px 24px; font-size: 13px; color: #aaa; }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { color: #1a73e8; }

        /* ── Header ── */
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 24px; }
        .header-inner { max-width: 860px; margin: 0 auto; display: flex; align-items: center; gap: 32px; }

        .team-logo-wrap {
            width: 110px; height: 110px;
            background: rgba(255,255,255,.08);
            border: 2px solid rgba(255,255,255,.12);
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; padding: 10px;
        }
        .team-logo-wrap img { width: 100%; height: 100%; object-fit: contain; }
        .team-logo-placeholder { font-size: 48px; }

        .team-name { font-size: 1.9rem; font-weight: 800; margin-bottom: 4px; line-height: 1.1; }
        .team-sub  { color: #aaa; font-size: 0.95rem; margin-bottom: 14px; }
        .team-meta { display: flex; flex-wrap: wrap; gap: 20px; }
        .meta-item { font-size: 13px; color: #aaa; }
        .meta-item strong { color: white; font-size: 15px; display: block; margin-bottom: 2px; }

        /* ── Content ── */
        .content { max-width: 860px; margin: 24px auto; padding: 0 20px; }

        /* ── Stat strip ── */
        .stat-strip {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
            gap: 1px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }
        .strip-item { background: white; padding: 16px 12px; text-align: center; }
        .strip-item .val { font-size: 1.6rem; font-weight: 800; color: #1a73e8; line-height: 1; }
        .strip-item .val.green { color: #28a745; }
        .strip-item .val.red   { color: #dc3545; }
        .strip-item .val.grey  { color: #888; }
        .strip-item .lbl { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }

        /* ── Cards ── */
        .card { background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,.08); padding: 24px; margin-bottom: 20px; }
        .card h2 {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.08em; color: #888; margin-bottom: 16px;
            border-left: 3px solid #1a73e8; padding-left: 10px;
        }

        /* ── Info grid ── */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { background: #f9fafb; border: 1px solid #eef0f2; border-radius: 8px; padding: 12px 14px; }
        .info-item label { display: block; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .info-item span  { font-size: 1rem; font-weight: 600; }

        /* ── Fixture table ── */
        table { border-collapse: collapse; width: 100%; font-size: 14px; }
        th { text-align: left; padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #eee; }
        td { padding: 11px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr.clickable { cursor: pointer; }
        tr.clickable:hover td { background: #f0f6ff; }

        /* ── Match cell ── */
        .match-cell { display: flex; align-items: center; gap: 8px; min-width: 220px; }
        .match-side { display: flex; align-items: center; gap: 6px; flex: 1; }
        .match-side.away { justify-content: flex-end; }
        .match-side img  { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
        .match-side .name { font-size: 13px; font-weight: 600; }
        .match-side .name.own { color: #1a73e8; }
        .match-divider { font-size: 11px; color: #ccc; font-weight: 700; flex-shrink: 0; padding: 0 2px; }

        /* ── Score & result ── */
        .score { font-weight: 700; font-size: 15px; white-space: nowrap; }
        .result-pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-left: 4px; }
        .result-pill.win  { background: #d4edda; color: #155724; }
        .result-pill.loss { background: #f8d7da; color: #721c24; }
        .result-pill.draw { background: #f0f0f0; color: #555; }

        /* ── Status pills ── */
        .pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .pill.ft   { background: #d4edda; color: #155724; }
        .pill.ns   { background: #fff3cd; color: #856404; }
        .pill.live { background: #f8d7da; color: #721c24; }

        /* ── League cell ── */
        .league-cell { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; }
        .league-cell img { height: 16px; width: 16px; object-fit: contain; }

        a { color: #1a73e8; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>

<nav class="navbar">
    <a href="index.php" class="nav-brand">⚽ Football DB</a>
    <div class="nav-links">
        <a href="index.php?view=leagues">🏆 Leagues</a>
        <a href="index.php?view=teams">👥 Teams</a>
        <a href="index.php?view=fixtures">📅 Fixtures</a>
        <a href="index.php?view=players">🧑 Players</a>
    </div>
</nav>

<div class="breadcrumb">
    <a href="index.php">Home</a> › <a href="index.php?view=teams">Teams</a> › <?= htmlspecialchars($team['name']) ?>
</div>

<div class="header">
    <div class="header-inner">
        <div class="team-logo-wrap">
            <?php if ($team['logo']): ?>
                <img src="<?= htmlspecialchars($team['logo']) ?>" alt="<?= htmlspecialchars($team['name']) ?>">
            <?php else: ?>
                <span class="team-logo-placeholder">🏟️</span>
            <?php endif; ?>
        </div>
        <div>
            <div class="team-name"><?= htmlspecialchars($team['name']) ?></div>
            <div class="team-sub">
                <?= htmlspecialchars($team['country'] ?? '') ?>
                <?= $team['code']     ? ' · ' . htmlspecialchars($team['code'])  : '' ?>
                <?= $team['national'] ? ' · National Team'                        : '' ?>
            </div>
            <div class="team-meta">
                <?php if ($team['founded']): ?>
                <div class="meta-item">
                    <strong><?= $team['founded'] ?></strong>
                    Founded
                </div>
                <?php endif; ?>
                <?php if ($venue && $venue['name']): ?>
                <div class="meta-item">
                    <strong><?= htmlspecialchars($venue['name']) ?></strong>
                    Stadium
                </div>
                <?php endif; ?>
                <?php if ($venue && $venue['capacity']): ?>
                <div class="meta-item">
                    <strong><?= number_format($venue['capacity']) ?></strong>
                    Capacity
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<div class="content">

    <!-- Season record strip -->
    <?php if ($stat_played > 0): ?>
    <div class="stat-strip">
        <div class="strip-item">
            <div class="val"><?= $stat_played ?></div>
            <div class="lbl">Played</div>
        </div>
        <div class="strip-item">
            <div class="val green"><?= $stat_won ?></div>
            <div class="lbl">Won</div>
        </div>
        <div class="strip-item">
            <div class="val grey"><?= $stat_drawn ?></div>
            <div class="lbl">Drawn</div>
        </div>
        <div class="strip-item">
            <div class="val red"><?= $stat_lost ?></div>
            <div class="lbl">Lost</div>
        </div>
        <div class="strip-item">
            <div class="val"><?= $stat_gf ?></div>
            <div class="lbl">Goals For</div>
        </div>
        <div class="strip-item">
            <div class="val red"><?= $stat_ga ?></div>
            <div class="lbl">Against</div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Venue -->
    <?php if ($venue && $venue['name']): ?>
    <div class="card">
        <h2>Venue</h2>
        <?php if ($venue['image']): ?>
            <img src="<?= htmlspecialchars($venue['image']) ?>"
                 style="width:100%;border-radius:8px;margin-bottom:16px;max-height:220px;object-fit:cover">
        <?php endif; ?>
        <div class="info-grid">
            <div class="info-item">
                <label>Stadium</label>
                <span><?= htmlspecialchars($venue['name'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>City</label>
                <span><?= htmlspecialchars($venue['city'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Capacity</label>
                <span><?= $venue['capacity'] ? number_format($venue['capacity']) : '—' ?></span>
            </div>
            <div class="info-item">
                <label>Surface</label>
                <span><?= htmlspecialchars($venue['surface'] ?? '—') ?></span>
            </div>
            <?php if ($venue['address']): ?>
            <div class="info-item" style="grid-column: span 2">
                <label>Address</label>
                <span><?= htmlspecialchars($venue['address']) ?></span>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- Fixtures -->
    <?php if ($fixtures): ?>
    <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:20px 24px 0">
            <h2 style="margin-bottom:0">2026 Fixtures · <?= count($fixtures) ?> matches</h2>
        </div>
        <table style="margin-top:16px">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Match</th>
                    <th>Score</th>
                    <th>Competition</th>
                    <th>Round</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($fixtures as $f):
                $finished   = in_array($f['status_short'], ['FT', 'AET', 'PEN']);
                $live       = in_array($f['status_short'], ['1H', '2H', 'HT', 'ET', 'P']);
                $is_home    = ($f['home_team_id'] == $id);
                $team_goals = $is_home ? $f['home_goals'] : $f['away_goals'];
                $opp_goals  = $is_home ? $f['away_goals'] : $f['home_goals'];

                if ($finished) {
                    if ($team_goals > $opp_goals)     $result_class = 'win';
                    elseif ($team_goals < $opp_goals) $result_class = 'loss';
                    else                              $result_class = 'draw';
                } else {
                    $result_class = '';
                }

                $pill_class = $finished ? 'ft' : ($live ? 'live' : 'ns');
            ?>
            <tr class="clickable" onclick="location.href='fixture.php?id=<?= $f['id'] ?>'">
                <td style="white-space:nowrap;color:#888;font-size:13px">
                    <?= date('d M Y', strtotime($f['date'])) ?><br>
                    <span style="font-size:11px"><?= date('H:i', strtotime($f['date'])) ?> UTC</span>
                </td>
                <td>
                    <div class="match-cell">
                        <div class="match-side">
                            <?= $f['home_logo'] ? "<img src='{$f['home_logo']}' alt=''>" : '' ?>
                            <span class="name <?= $f['home_team_id'] == $id ? 'own' : '' ?>"><?= htmlspecialchars($f['home_name']) ?></span>
                        </div>
                        <div class="match-divider">vs</div>
                        <div class="match-side away">
                            <span class="name <?= $f['away_team_id'] == $id ? 'own' : '' ?>"><?= htmlspecialchars($f['away_name']) ?></span>
                            <?= $f['away_logo'] ? "<img src='{$f['away_logo']}' alt=''>" : '' ?>
                        </div>
                    </div>
                </td>
                <td style="white-space:nowrap">
                    <?php if ($finished || $live): ?>
                        <span class="score"><?= $f['home_goals'] ?> – <?= $f['away_goals'] ?></span>
                        <?php if ($finished && $result_class): ?>
                            <span class="result-pill <?= $result_class ?>"><?= strtoupper($result_class) ?></span>
                        <?php endif; ?>
                    <?php else: ?>
                        <span style="color:#bbb;font-size:13px">—</span>
                    <?php endif; ?>
                </td>
                <td>
                    <div class="league-cell">
                        <?= $f['league_logo'] ? "<img src='{$f['league_logo']}' alt=''>" : '' ?>
                        <?= htmlspecialchars($f['league_name'] ?? '—') ?>
                    </div>
                </td>
                <td style="font-size:13px;color:#666"><?= htmlspecialchars($f['round'] ?? '—') ?></td>
                <td><span class="pill <?= $pill_class ?>"><?= htmlspecialchars($f['status_short']) ?></span></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php else: ?>
    <div class="card" style="text-align:center;color:#888;padding:48px">
        No 2026 fixtures found for this team.
    </div>
    <?php endif; ?>

</div>
</body>
</html>
