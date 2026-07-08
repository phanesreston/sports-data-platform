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
        .back { display: inline-block; margin: 20px; color: #1a73e8; text-decoration: none; font-size: 14px; }
        .back:hover { text-decoration: underline; }

        .breadcrumb {
            background: white;
            border-bottom: 1px solid #e8e8e8;
            padding: 10px 24px;
            font-size: 13px;
            color: #aaa;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { color: #1a73e8; }

        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 40px;
            display: flex;
            align-items: center;
            gap: 30px;
        }
        .header img { width: 100px; height: 100px; object-fit: contain; }
        .header h1  { font-size: 2rem; margin-bottom: 6px; }
        .header p   { color: #aaa; font-size: 0.95rem; }

        .content { max-width: 860px; margin: 30px auto; padding: 0 20px; }

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
            border-left: 3px solid #1a73e8;
            padding-left: 10px;
        }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { background: #f9fafb; border: 1px solid #eef0f2; border-radius: 8px; padding: 12px 14px; }
        .info-item label { display: block; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
        .info-item span  { font-size: 1rem; font-weight: 600; }

        table { border-collapse: collapse; width: 100%; font-size: 14px; }
        th {
            text-align: left;
            padding: 8px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #888;
            border-bottom: 2px solid #eee;
        }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafafa; }

        .match-teams {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .match-teams img { height: 20px; width: 20px; object-fit: contain; }
        .match-teams span { font-weight: 600; }
        .match-teams .vs { color: #bbb; font-size: 12px; }

        .score {
            font-weight: 700;
            font-size: 15px;
            text-align: center;
            white-space: nowrap;
        }
        .result-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
        }
        .result-pill.win  { background: #d4edda; color: #155724; }
        .result-pill.loss { background: #f8d7da; color: #721c24; }
        .result-pill.draw { background: #f0f0f0; color: #555; }

        .pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .pill.ft   { background: #d4edda; color: #155724; }
        .pill.ns   { background: #fff3cd; color: #856404; }
        .pill.live { background: #f8d7da; color: #721c24; }

        .league-cell {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #666;
        }
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
    <?php if ($team['logo']): ?>
        <img src="<?= htmlspecialchars($team['logo']) ?>" alt="<?= htmlspecialchars($team['name']) ?>">
    <?php endif; ?>
    <div>
        <h1><?= htmlspecialchars($team['name']) ?></h1>
        <p>
            <?= htmlspecialchars($team['country'] ?? '') ?>
            <?= $team['code'] ? " · " . htmlspecialchars($team['code']) : "" ?>
            <?= $team['national'] ? " · National Team" : "" ?>
        </p>
    </div>
</div>

<div class="content">

    <!-- Team Info -->
    <div class="card">
        <h2>Team Info</h2>
        <div class="info-grid">
            <div class="info-item">
                <label>Country</label>
                <span><?= htmlspecialchars($team['country'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Code</label>
                <span><?= htmlspecialchars($team['code'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Founded</label>
                <span><?= $team['founded'] ?? '—' ?></span>
            </div>
            <div class="info-item">
                <label>National Team</label>
                <span><?= $team['national'] ? 'Yes' : 'No' ?></span>
            </div>
            <div class="info-item">
                <label>Team ID</label>
                <span><?= $team['id'] ?></span>
            </div>
        </div>
    </div>

    <!-- Venue -->
    <?php if ($venue && $venue['name']): ?>
    <div class="card">
        <h2>Venue</h2>
        <?php if ($venue['image']): ?>
            <img src="<?= htmlspecialchars($venue['image']) ?>"
                 style="width:100%;border-radius:6px;margin-bottom:16px;max-height:220px;object-fit:cover">
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
            <div class="info-item">
                <label>Address</label>
                <span><?= htmlspecialchars($venue['address'] ?? '—') ?></span>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Fixtures -->
    <?php if ($fixtures): ?>
    <div class="card">
        <h2>2026 Fixtures (<?= count($fixtures) ?>)</h2>
        <table>
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
                    if ($team_goals > $opp_goals)     $result_class = "win";
                    elseif ($team_goals < $opp_goals) $result_class = "loss";
                    else                              $result_class = "draw";
                } else {
                    $result_class = "";
                }

                if ($finished)  $pill_class = "ft";
                elseif ($live)  $pill_class = "live";
                else            $pill_class = "ns";
            ?>
                <tr>
                    <td style="white-space:nowrap;color:#888;font-size:13px">
                        <?= date('d M Y', strtotime($f['date'])) ?><br>
                        <span style="font-size:11px"><?= date('H:i', strtotime($f['date'])) ?> UTC</span>
                    </td>
                    <td>
                        <a href="fixture.php?id=<?= $f['id'] ?>">
                            <div class="match-teams">
                                <?= $f['home_logo'] ? "<img src='{$f['home_logo']}' alt=''>" : "" ?>
                                <span><?= htmlspecialchars($f['home_name']) ?></span>
                                <span class="vs">vs</span>
                                <?= $f['away_logo'] ? "<img src='{$f['away_logo']}' alt=''>" : "" ?>
                                <span><?= htmlspecialchars($f['away_name']) ?></span>
                            </div>
                        </a>
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
                            <?= $f['league_logo'] ? "<img src='{$f['league_logo']}' alt=''>" : "" ?>
                            <?= htmlspecialchars($f['league_name'] ?? '—') ?>
                        </div>
                    </td>
                    <td style="font-size:13px;color:#666">
                        <?= htmlspecialchars($f['round'] ?? '—') ?>
                    </td>
                    <td>
                        <span class="pill <?= $pill_class ?>">
                            <?= htmlspecialchars($f['status_short']) ?>
                        </span>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php else: ?>
    <div class="card" style="text-align:center;color:#888;padding:40px">
        No 2026 fixtures found for this team.
    </div>
    <?php endif; ?>

</div>
</body>
</html>
