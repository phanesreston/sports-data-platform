<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$id = intval($_GET['id'] ?? 0);
if (!$id) { header("Location: index.php"); exit; }

$stmt = $conn->prepare("SELECT * FROM leagues WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$league = $stmt->get_result()->fetch_assoc();
if (!$league) { echo "League not found."; exit; }

$stmt2 = $conn->prepare("SELECT * FROM league_seasons WHERE league_id = ? ORDER BY year DESC");
$stmt2->bind_param("i", $id);
$stmt2->execute();
$seasons = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

$current = array_filter($seasons, fn($s) => $s['current_season']);
$current = reset($current);

$stmt3 = $conn->prepare("
    SELECT
        f.id, f.date, f.round, f.season,
        f.status_short, f.status_long, f.status_elapsed,
        f.home_goals, f.away_goals,
        f.ht_home, f.ht_away,
        ht.name AS home_name, ht.logo AS home_logo,
        at.name AS away_name, at.logo AS away_logo
    FROM fixtures f
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    WHERE f.league_id = ?
    ORDER BY f.date DESC
");
$stmt3->bind_param("i", $id);
$stmt3->execute();
$fixtures = $stmt3->get_result()->fetch_all(MYSQLI_ASSOC);

// Group fixtures by round
$by_round = [];
foreach ($fixtures as $f) {
    $by_round[$f['round'] ?? 'Other'][] = $f;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?= htmlspecialchars($league['name']) ?></title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; background: #f5f5f5; color: #333; }

        .navbar { background: #111; color: white; display: flex; align-items: center; padding: 0 24px; height: 54px; gap: 32px; }
        .nav-brand { font-size: 1rem; font-weight: 800; color: white; text-decoration: none; }
        .nav-links { display: flex; gap: 4px; }
        .nav-links a { color: #aaa; text-decoration: none; font-size: 14px; font-weight: 600; padding: 6px 14px; border-radius: 6px; }
        .nav-links a:hover { color: white; background: #222; }
        .back { display: inline-block; margin: 20px; color: #1a73e8; text-decoration: none; font-size: 14px; }
        .back:hover { text-decoration: underline; }

        .header {
            background: #222;
            color: white;
            padding: 40px;
            display: flex;
            align-items: center;
            gap: 30px;
        }
        .header img { width: 90px; height: 90px; object-fit: contain; }
        .header h1  { font-size: 2rem; margin-bottom: 6px; }
        .header p   { color: #aaa; font-size: 0.95rem; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #444; color: #ddd; margin-top: 8px; }

        .content { max-width: 900px; margin: 30px auto; padding: 0 20px; }

        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0,0,0,.1);
            padding: 24px;
            margin-bottom: 20px;
        }
        .card h2 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #888;
            margin-bottom: 16px;
        }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .info-item label { display: block; font-size: 12px; color: #888; margin-bottom: 2px; }
        .info-item span  { font-size: 1.05rem; font-weight: 600; }

        .round-header {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #888;
            padding: 10px 16px;
            background: #f9f9f9;
            border-bottom: 1px solid #eee;
            border-top: 1px solid #eee;
        }
        .round-header:first-child { border-top: none; }

        .fixture-row {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            text-decoration: none;
            color: inherit;
            transition: background 0.1s;
        }
        .fixture-row:last-child { border-bottom: none; }
        .fixture-row:hover { background: #f5f5f5; }

        .fixture-date {
            width: 90px;
            font-size: 12px;
            color: #888;
            flex-shrink: 0;
        }
        .fixture-teams {
            flex: 1;
            display: flex;
            align-items: center;
        }
        .team-side {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        .team-side.away { justify-content: flex-end; }
        .team-side img  { width: 22px; height: 22px; object-fit: contain; flex-shrink: 0; }
        .team-name { font-size: 14px; font-weight: 600; }

        .fixture-score {
            width: 80px;
            text-align: center;
            flex-shrink: 0;
        }
        .score-box {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 15px;
            background: #f0f0f0;
            color: #333;
        }
        .score-box.ft   { background: #222; color: white; }
        .score-box.ns   { background: #fff3cd; color: #856404; font-size: 12px; font-weight: 600; padding: 4px 8px; }
        .score-box.live { background: #f8d7da; color: #721c24; font-size: 12px; font-weight: 600; padding: 4px 8px; }

        .fixture-status {
            width: 60px;
            text-align: right;
            flex-shrink: 0;
        }
        .pill {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .pill.ft   { background: #d4edda; color: #155724; }
        .pill.ns   { background: #fff3cd; color: #856404; }
        .pill.live { background: #f8d7da; color: #721c24; }

        .no-fixtures { text-align: center; color: #888; padding: 40px; font-size: 14px; }

        table { border-collapse: collapse; width: 100%; font-size: 14px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #eee; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        tr:last-child td { border-bottom: none; }
        .season-pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #d4edda; color: #155724; }
    </style>
</head>
<body>

<nav class="navbar">
    <a href="index.php" class="nav-brand">⚽ Football DB</a>
    <div class="nav-links">
        <a href="index.php?view=leagues">🏆 Leagues</a>
        <a href="index.php?view=teams">👥 Teams</a>
        <a href="index.php?view=fixtures">📅 Fixtures</a>
    </div>
</nav>

<a href="index.php?view=leagues" class="back">← Back to leagues</a>

<div class="header">
    <?php if ($league['logo']): ?>
        <img src="<?= htmlspecialchars($league['logo']) ?>" alt="<?= htmlspecialchars($league['name']) ?>">
    <?php endif; ?>
    <div>
        <h1><?= htmlspecialchars($league['name']) ?></h1>
        <p>
            <?= htmlspecialchars($league['country_name'] ?? '') ?>
            <?= $league['country_flag'] ? " · <img src='{$league['country_flag']}' height='14' style='vertical-align:middle'>" : "" ?>
        </p>
        <span class="badge"><?= htmlspecialchars($league['type'] ?? '') ?></span>
    </div>
</div>

<div class="content">

    <!-- League Info -->
    <div class="card">
        <h2>League Info</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Country</label>
                <span><?= htmlspecialchars($league['country_name'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Type</label>
                <span><?= htmlspecialchars($league['type'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Current Season</label>
                <span><?= $current ? $current['year'] : '—' ?></span>
            </div>
            <div class="info-item">
                <label>Season Dates</label>
                <span><?= $current ? $current['start_date'] . ' → ' . $current['end_date'] : '—' ?></span>
            </div>
            <div class="info-item">
                <label>Total Seasons</label>
                <span><?= count($seasons) ?></span>
            </div>
            <div class="info-item">
                <label>Fixtures in DB</label>
                <span><?= count($fixtures) ?></span>
            </div>
        </div>
    </div>

    <!-- Fixtures -->
    <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 16px 0;display:flex;align-items:center;justify-content:space-between">
            <h2 style="margin-bottom:16px">Fixtures</h2>
        </div>

        <?php if ($fixtures): ?>
            <?php foreach ($by_round as $round => $round_fixtures): ?>
                <div class="round-header"><?= htmlspecialchars($round) ?></div>
                <?php foreach ($round_fixtures as $f):
                    $finished = in_array($f['status_short'], ['FT', 'AET', 'PEN']);
                    $live     = in_array($f['status_short'], ['1H', '2H', 'HT', 'ET', 'P']);

                    if ($finished)      { $score_class = 'ft';   $pill_class = 'ft'; }
                    elseif ($live)      { $score_class = 'live'; $pill_class = 'live'; }
                    else                { $score_class = 'ns';   $pill_class = 'ns'; }
                ?>
                <a href="fixture.php?id=<?= $f['id'] ?>" class="fixture-row">

                    <div class="fixture-date">
                        <?= date('d M Y', strtotime($f['date'])) ?><br>
                        <span style="font-size:11px"><?= date('H:i', strtotime($f['date'])) ?> UTC</span>
                    </div>

                    <div class="fixture-teams">
                        <div class="team-side">
                            <?= $f['home_logo'] ? "<img src='{$f['home_logo']}' alt=''>" : "" ?>
                            <span class="team-name"><?= htmlspecialchars($f['home_name']) ?></span>
                        </div>

                        <div class="fixture-score">
                            <?php if ($finished): ?>
                                <span class="score-box ft"><?= $f['home_goals'] ?> – <?= $f['away_goals'] ?></span>
                            <?php elseif ($live): ?>
                                <span class="score-box live"><?= $f['home_goals'] ?>–<?= $f['away_goals'] ?> <?= $f['status_elapsed'] ?>′</span>
                            <?php else: ?>
                                <span class="score-box ns"><?= date('H:i', strtotime($f['date'])) ?></span>
                            <?php endif; ?>
                        </div>

                        <div class="team-side away">
                            <span class="team-name"><?= htmlspecialchars($f['away_name']) ?></span>
                            <?= $f['away_logo'] ? "<img src='{$f['away_logo']}' alt=''>" : "" ?>
                        </div>
                    </div>

                    <div class="fixture-status">
                        <span class="pill <?= $pill_class ?>"><?= $f['status_short'] ?></span>
                    </div>

                </a>
                <?php endforeach; ?>
            <?php endforeach; ?>

        <?php else: ?>
            <div class="no-fixtures">No fixtures found for this league.</div>
        <?php endif; ?>
    </div>

    <!-- Season History -->
    <?php if ($seasons): ?>
    <div class="card">
        <h2>Season History</h2>
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($seasons as $s): ?>
                <tr>
                    <td><strong><?= $s['year'] ?></strong></td>
                    <td><?= $s['start_date'] ?? '—' ?></td>
                    <td><?= $s['end_date']   ?? '—' ?></td>
                    <td><?= $s['current_season'] ? '<span class="season-pill">Current</span>' : '' ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>

</div>
</body>
</html>
