<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$id = intval($_GET['id'] ?? 0);
if (!$id) { header("Location: index.php?view=players"); exit; }

// Player profile
$stmt = $conn->prepare("SELECT * FROM players WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$player = $stmt->get_result()->fetch_assoc();
if (!$player) { echo "Player not found."; exit; }

// Stats rows (may span multiple leagues/teams)
$stmt2 = $conn->prepare("
    SELECT ps.*,
           t.name AS team_name, t.logo AS team_logo,
           l.name AS league_name, l.logo AS league_logo
    FROM player_stats ps
    LEFT JOIN teams   t ON t.id = ps.team_id
    LEFT JOIN leagues l ON l.id = ps.league_id
    WHERE ps.player_id = ?
    ORDER BY ps.season DESC, ps.appearances DESC
");
$stmt2->bind_param("i", $id);
$stmt2->execute();
$all_stats = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

// Primary stat row = most appearances in most recent season
$stats = $all_stats[0] ?? null;

function val($v, $suffix = '') {
    return ($v !== null && $v !== '') ? htmlspecialchars($v) . $suffix : '—';
}
function pct($won, $total) {
    if (!$total) return '—';
    return round(($won / $total) * 100) . '%';
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?= htmlspecialchars($player['name']) ?></title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #333; }

        .navbar { background: #111; color: white; display: flex; align-items: center; padding: 0 24px; height: 54px; gap: 32px; }
        .nav-brand { font-size: 1rem; font-weight: 800; color: white; text-decoration: none; }
        .nav-links { display: flex; gap: 4px; }
        .nav-links a { color: #aaa; text-decoration: none; font-size: 14px; font-weight: 600; padding: 6px 14px; border-radius: 6px; }
        .nav-links a:hover { color: white; background: #222; }

        .breadcrumb {
            background: white;
            border-bottom: 1px solid #e8e8e8;
            padding: 10px 24px;
            font-size: 13px;
            color: #aaa;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { color: #1a73e8; }

        /* ── Header ── */
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 40px 24px;
        }
        .header-inner {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 32px;
        }
        .player-photo {
            width: 110px;
            height: 110px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid rgba(255,255,255,.2);
            background: #333;
            flex-shrink: 0;
        }
        .player-photo-placeholder {
            width: 110px; height: 110px; border-radius: 50%;
            background: #333; display: flex; align-items: center;
            justify-content: center; font-size: 40px; flex-shrink: 0;
        }
        .player-name { font-size: 1.9rem; font-weight: 800; margin-bottom: 6px; line-height: 1.1; }
        .player-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
        .meta-item { font-size: 13px; color: #aaa; }
        .meta-item strong { color: white; font-size: 14px; display: block; }
        .position-badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 0.04em;
        }
        .pos-Goalkeeper { background: #ffc107; color: #333; }
        .pos-Defender   { background: #28a745; color: white; }
        .pos-Midfielder { background: #1a73e8; color: white; }
        .pos-Attacker   { background: #dc3545; color: white; }

        .team-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }
        .team-badge img { width: 22px; height: 22px; object-fit: contain; }
        .team-badge span { font-size: 14px; font-weight: 600; }

        /* ── Content ── */
        .content { max-width: 900px; margin: 24px auto; padding: 0 20px; }

        /* ── Stat summary strip ── */
        .stat-strip {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 1px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }
        .strip-item {
            background: white;
            padding: 16px 12px;
            text-align: center;
        }
        .strip-item .val { font-size: 1.6rem; font-weight: 800; color: #1a73e8; line-height: 1; }
        .strip-item .lbl { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }

        /* ── Cards ── */
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 1px 4px rgba(0,0,0,.08);
            padding: 20px 24px;
            margin-bottom: 16px;
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

        /* ── Stat grid ── */
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 10px;
        }
        .stat-item { background: #f9fafb; border: 1px solid #eef0f2; border-radius: 8px; padding: 14px 16px; }
        .stat-item .s-lbl { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 5px; }
        .stat-item .s-val { font-size: 1.25rem; font-weight: 700; color: #222; }
        .stat-item .s-sub { font-size: 11px; color: #aaa; margin-top: 3px; }

        /* ── Season history table ── */
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #999; border-bottom: 2px solid #eee; }
        td { padding: 9px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafcff; }
        .team-cell { display: flex; align-items: center; gap: 8px; }
        .team-cell img { width: 20px; height: 20px; object-fit: contain; }

        .no-stats { color: #aaa; text-align: center; padding: 48px; font-size: 14px; }
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
    <a href="index.php">Home</a> › <a href="index.php?view=players">Players</a> › <?= htmlspecialchars($player['name']) ?>
</div>

<!-- Player header -->
<div class="header">
    <div class="header-inner">
        <?php if ($player['photo']): ?>
            <img class="player-photo" src="<?= htmlspecialchars($player['photo']) ?>" alt="">
        <?php else: ?>
            <div class="player-photo-placeholder">👤</div>
        <?php endif; ?>
        <div>
            <?php if ($stats && $stats['position']): ?>
                <span class="position-badge pos-<?= htmlspecialchars($stats['position']) ?>"><?= htmlspecialchars($stats['position']) ?></span>
            <?php endif; ?>
            <div class="player-name"><?= htmlspecialchars($player['name']) ?></div>
            <?php if ($stats && $stats['team_name']): ?>
                <div class="team-badge">
                    <?= $stats['team_logo'] ? "<img src='{$stats['team_logo']}'>" : '' ?>
                    <span><?= htmlspecialchars($stats['team_name']) ?></span>
                    <?php if ($stats['league_name']): ?>
                        <span style="color:#666">· <?= htmlspecialchars($stats['league_name']) ?></span>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            <div class="player-meta">
                <?php if ($player['nationality']): ?>
                <div class="meta-item">
                    <strong><?= htmlspecialchars($player['nationality']) ?></strong>
                    Nationality
                </div>
                <?php endif; ?>
                <?php if ($player['age']): ?>
                <div class="meta-item">
                    <strong><?= $player['age'] ?></strong>
                    Age
                </div>
                <?php endif; ?>
                <?php if ($player['height']): ?>
                <div class="meta-item">
                    <strong><?= htmlspecialchars($player['height']) ?></strong>
                    Height
                </div>
                <?php endif; ?>
                <?php if ($player['weight']): ?>
                <div class="meta-item">
                    <strong><?= htmlspecialchars($player['weight']) ?></strong>
                    Weight
                </div>
                <?php endif; ?>
                <?php if ($stats && $stats['rating']): ?>
                <div class="meta-item">
                    <strong><?= number_format((float)$stats['rating'], 1) ?></strong>
                    Avg Rating
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<div class="content">

<?php if ($stats): ?>

<!-- Key stats strip -->
<div class="stat-strip">
    <div class="strip-item">
        <div class="val"><?= $stats['appearances'] ?? '0' ?></div>
        <div class="lbl">Apps</div>
    </div>
    <div class="strip-item">
        <div class="val"><?= $stats['goals'] ?? '0' ?></div>
        <div class="lbl">Goals</div>
    </div>
    <div class="strip-item">
        <div class="val"><?= $stats['assists'] ?? '0' ?></div>
        <div class="lbl">Assists</div>
    </div>
    <div class="strip-item">
        <div class="val"><?= $stats['minutes'] ?? '0' ?></div>
        <div class="lbl">Minutes</div>
    </div>
    <div class="strip-item">
        <div class="val"><?= $stats['yellow_cards'] ?? '0' ?></div>
        <div class="lbl">Yellows</div>
    </div>
    <div class="strip-item">
        <div class="val"><?= $stats['red_cards'] ?? '0' ?></div>
        <div class="lbl">Reds</div>
    </div>
</div>

<!-- Attack -->
<div class="card">
    <h2>Goals &amp; Attack</h2>
    <div class="stat-grid">
        <div class="stat-item">
            <div class="s-lbl">Goals</div>
            <div class="s-val"><?= val($stats['goals']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Assists</div>
            <div class="s-val"><?= val($stats['assists']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Shots Total</div>
            <div class="s-val"><?= val($stats['shots_total']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Shots on Target</div>
            <div class="s-val"><?= val($stats['shots_on']) ?></div>
            <?php if ($stats['shots_total']): ?>
            <div class="s-sub"><?= pct($stats['shots_on'], $stats['shots_total']) ?> accuracy</div>
            <?php endif; ?>
        </div>
        <?php if ($stats['saves'] !== null): ?>
        <div class="stat-item">
            <div class="s-lbl">Saves</div>
            <div class="s-val"><?= val($stats['saves']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Goals Conceded</div>
            <div class="s-val"><?= val($stats['conceded']) ?></div>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Passing -->
<div class="card">
    <h2>Passing</h2>
    <div class="stat-grid">
        <div class="stat-item">
            <div class="s-lbl">Total Passes</div>
            <div class="s-val"><?= val($stats['passes_total']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Key Passes</div>
            <div class="s-val"><?= val($stats['passes_key']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Pass Accuracy</div>
            <div class="s-val"><?= $stats['passes_accuracy'] ? val($stats['passes_accuracy'], '%') : '—' ?></div>
        </div>
    </div>
</div>

<!-- Defence -->
<div class="card">
    <h2>Defence</h2>
    <div class="stat-grid">
        <div class="stat-item">
            <div class="s-lbl">Tackles</div>
            <div class="s-val"><?= val($stats['tackles_total']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Blocks</div>
            <div class="s-val"><?= val($stats['blocks']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Interceptions</div>
            <div class="s-val"><?= val($stats['interceptions']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Duels Total</div>
            <div class="s-val"><?= val($stats['duels_total']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Duels Won</div>
            <div class="s-val"><?= val($stats['duels_won']) ?></div>
            <?php if ($stats['duels_total']): ?>
            <div class="s-sub"><?= pct($stats['duels_won'], $stats['duels_total']) ?> win rate</div>
            <?php endif; ?>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Dribbles</div>
            <div class="s-val"><?= val($stats['dribbles_success']) ?> / <?= val($stats['dribbles_attempts']) ?></div>
            <div class="s-sub">success / attempts</div>
        </div>
    </div>
</div>

<!-- Discipline -->
<div class="card">
    <h2>Discipline</h2>
    <div class="stat-grid">
        <div class="stat-item">
            <div class="s-lbl">Yellow Cards</div>
            <div class="s-val" style="color:#d4a017"><?= val($stats['yellow_cards']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Yellow-Red</div>
            <div class="s-val" style="color:#e8700a"><?= val($stats['yellowred_cards']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Red Cards</div>
            <div class="s-val" style="color:#dc3545"><?= val($stats['red_cards']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Fouls Committed</div>
            <div class="s-val"><?= val($stats['fouls_committed']) ?></div>
        </div>
        <div class="stat-item">
            <div class="s-lbl">Fouls Drawn</div>
            <div class="s-val"><?= val($stats['fouls_drawn']) ?></div>
        </div>
    </div>
</div>

<?php if ($stats['penalty_scored'] !== null || $stats['penalty_missed'] !== null): ?>
<!-- Penalties -->
<div class="card">
    <h2>Penalties</h2>
    <div class="stat-grid">
        <div class="stat-item"><div class="s-lbl">Scored</div><div class="s-val"><?= val($stats['penalty_scored']) ?></div></div>
        <div class="stat-item"><div class="s-lbl">Missed</div><div class="s-val"><?= val($stats['penalty_missed']) ?></div></div>
        <div class="stat-item"><div class="s-lbl">Won</div><div class="s-val"><?= val($stats['penalty_won']) ?></div></div>
        <div class="stat-item"><div class="s-lbl">Committed</div><div class="s-val"><?= val($stats['penalty_committed']) ?></div></div>
        <div class="stat-item"><div class="s-lbl">Saved</div><div class="s-val"><?= val($stats['penalty_saved']) ?></div></div>
    </div>
</div>
<?php endif; ?>

<!-- Season history (all entries) -->
<?php if (count($all_stats) > 1): ?>
<div class="card">
    <h2>Season History</h2>
    <table>
        <thead>
            <tr>
                <th>Season</th><th>Team</th><th>League</th><th>Pos</th>
                <th>Apps</th><th>Goals</th><th>Assists</th><th>Mins</th><th>Rating</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($all_stats as $s): ?>
        <tr>
            <td><?= $s['season'] ?? '—' ?></td>
            <td>
                <div class="team-cell">
                    <?= $s['team_logo'] ? "<img src='{$s['team_logo']}'>" : '' ?>
                    <?= htmlspecialchars($s['team_name'] ?? '—') ?>
                </div>
            </td>
            <td style="font-size:12px;color:#666"><?= htmlspecialchars($s['league_name'] ?? '—') ?></td>
            <td><?= htmlspecialchars($s['position'] ?? '—') ?></td>
            <td><?= $s['appearances'] ?? '—' ?></td>
            <td><?= $s['goals'] ?? '—' ?></td>
            <td><?= $s['assists'] ?? '—' ?></td>
            <td><?= $s['minutes'] ?? '—' ?></td>
            <td><?= $s['rating'] ? number_format((float)$s['rating'], 1) : '—' ?></td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
<?php endif; ?>

<?php else: ?>
    <div class="card"><div class="no-stats">No stats available for this player yet.</div></div>
<?php endif; ?>

</div>
</body>
</html>
