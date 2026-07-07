<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$id = intval($_GET['id'] ?? 0);
if (!$id) { header("Location: index.php"); exit; }

$stmt = $conn->prepare("
    SELECT
        f.*,
        ht.name AS home_name, ht.logo AS home_logo,
        at.name AS away_name, at.logo AS away_logo,
        l.name AS league_name, l.logo AS league_logo
    FROM fixtures f
    JOIN teams ht  ON ht.id = f.home_team_id
    JOIN teams at  ON at.id = f.away_team_id
    LEFT JOIN leagues l ON l.id = f.league_id
    WHERE f.id = ?
");
$stmt->bind_param("i", $id);
$stmt->execute();
$f = $stmt->get_result()->fetch_assoc();
if (!$f) { echo "Fixture not found."; exit; }

$stmt2 = $conn->prepare("
    SELECT fs.*, t.name AS team_name, t.logo AS team_logo
    FROM fixture_statistics fs
    JOIN teams t ON t.id = fs.team_id
    WHERE fs.fixture_id = ?
");
$stmt2->bind_param("i", $id);
$stmt2->execute();
$stats_rows = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

$stats = [];
foreach ($stats_rows as $s) {
    $stats[$s['team_id']] = $s;
}
$home_stats = $stats[$f['home_team_id']] ?? null;
$away_stats = $stats[$f['away_team_id']] ?? null;

$finished = in_array($f['status_short'], ['FT', 'AET', 'PEN']);

$stat_labels = [
    'ball_possession'  => 'Ball Possession',
    'expected_goals'   => 'Expected Goals (xG)',
    'goals_prevented'  => 'Goals Prevented',
    'total_shots'      => 'Total Shots',
    'shots_on_goal'    => 'Shots on Target',
    'shots_off_goal'   => 'Shots off Target',
    'shots_insidebox'  => 'Shots Inside Box',
    'shots_outsidebox' => 'Shots Outside Box',
    'blocked_shots'    => 'Blocked Shots',
    'corner_kicks'     => 'Corner Kicks',
    'offsides'         => 'Offsides',
    'fouls'            => 'Fouls',
    'yellow_cards'     => 'Yellow Cards',
    'red_cards'        => 'Red Cards',
    'goalkeeper_saves' => 'Goalkeeper Saves',
    'total_passes'     => 'Total Passes',
    'passes_accurate'  => 'Accurate Passes',
    'passes_pct'       => 'Pass Accuracy',
];

// Pre-render AI copy text
$et_line  = ($f['et_home']  !== null) ? "Extra Time:  {$f['et_home']} - {$f['et_away']}\n" : "";
$pen_line = ($f['pen_home'] !== null) ? "Penalties:   {$f['pen_home']} - {$f['pen_away']}\n" : "";

ob_start();
echo "FIXTURE ANALYSIS\n";
echo "================\n";
echo "Match:       {$f['home_name']} vs {$f['away_name']}\n";
echo "Date:        " . date('d M Y H:i', strtotime($f['date'])) . " UTC\n";
echo "Competition: " . ($f['league_name'] ?? 'Unknown') . "\n";
echo "Round:       " . ($f['round'] ?? '—') . "\n";
echo "Referee:     " . ($f['referee'] ?? '—') . "\n";
echo "Status:      " . ($f['status_long'] ?? $f['status_short']) . "\n";
echo "\n";
echo "RESULT\n";
echo "======\n";
echo "{$f['home_name']}: " . ($f['home_goals'] ?? '—') . "\n";
echo "{$f['away_name']}: " . ($f['away_goals'] ?? '—') . "\n";
echo "Half Time:   " . ($f['ht_home'] !== null ? "{$f['ht_home']} - {$f['ht_away']}" : '—') . "\n";
echo "Full Time:   " . ($f['ft_home'] !== null ? "{$f['ft_home']} - {$f['ft_away']}" : '—') . "\n";
echo $et_line;
echo $pen_line;
echo "\n";

if ($home_stats && $away_stats) {
    $col1 = 24;
    $col2 = 16;

    echo "STATISTICS\n";
    echo "==========\n";
    echo str_pad('', $col1) . str_pad($f['home_name'], $col2) . $f['away_name'] . "\n";
    echo str_repeat('-', 56) . "\n";

    $stat_labels_copy = [
        'ball_possession'  => 'Ball Possession',
        'expected_goals'   => 'Expected Goals (xG)',
        'goals_prevented'  => 'Goals Prevented',
        'total_shots'      => 'Total Shots',
        'shots_on_goal'    => 'Shots on Target',
        'shots_off_goal'   => 'Shots off Target',
        'shots_insidebox'  => 'Shots Inside Box',
        'shots_outsidebox' => 'Shots Outside Box',
        'blocked_shots'    => 'Blocked Shots',
        'corner_kicks'     => 'Corner Kicks',
        'offsides'         => 'Offsides',
        'fouls'            => 'Fouls',
        'yellow_cards'     => 'Yellow Cards',
        'goalkeeper_saves' => 'Goalkeeper Saves',
        'total_passes'     => 'Total Passes',
        'passes_accurate'  => 'Accurate Passes',
        'passes_pct'       => 'Pass Accuracy',
    ];

    foreach ($stat_labels_copy as $col => $label) {
        $hv = $home_stats[$col] ?? null;
        $av = $away_stats[$col] ?? null;
        if ($hv === null && $av === null) continue;
        echo str_pad($label, $col1) . str_pad((string)($hv ?? '—'), $col2) . ($av ?? '—') . "\n";
    }

    echo "\n";
    echo str_repeat('-', 56) . "\n";
}

$ai_text = ob_get_clean();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?= htmlspecialchars($f['home_name']) ?> vs <?= htmlspecialchars($f['away_name']) ?></title>
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

        .header { background: #111; color: white; padding: 36px 20px; text-align: center; }
        .teams  { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
        .team   { display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 120px; }
        .team img { width: 70px; height: 70px; object-fit: contain; }
        .team span { font-size: 1rem; font-weight: 700; }
        .score { font-size: 3rem; font-weight: 900; min-width: 100px; text-align: center; }
        .score.pending { color: #888; font-size: 2rem; }
        .meta { margin-top: 16px; font-size: 13px; color: #aaa; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }

        .content { max-width: 800px; margin: 30px auto; padding: 0 20px; }

        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0,0,0,.1);
            padding: 24px;
            margin-bottom: 20px;
        }
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .card h2 {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #888;
            margin-bottom: 0;
        }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .info-item label { display: block; font-size: 12px; color: #888; margin-bottom: 2px; }
        .info-item span  { font-size: 1.05rem; font-weight: 600; }

        .stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .stat-val { font-weight: 700; font-size: 15px; width: 60px; }
        .stat-val.home { text-align: right; }
        .stat-val.away { text-align: left; }
        .stat-center { flex: 1; }
        .stat-label { text-align: center; font-size: 12px; color: #666; margin-bottom: 4px; }
        .bar-wrap { display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: #eee; }
        .bar-home { background: #1a73e8; }
        .bar-away { background: #e8341a; }

        .no-stats { color: #888; font-size: 14px; text-align: center; padding: 20px 0; }

        .copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .copy-btn:hover  { background: #f5f5f5; border-color: #bbb; }
        .copy-btn.copied { background: #d4edda; border-color: #a3d9a5; color: #155724; }
        .copy-btn.failed { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
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

<a href="javascript:history.back()" class="back">← Back</a>

<!-- Match header -->
<div class="header">
    <div class="teams">
        <div class="team">
            <?= $f['home_logo'] ? "<img src='{$f['home_logo']}' alt=''>" : "" ?>
            <span><?= htmlspecialchars($f['home_name']) ?></span>
        </div>
        <div class="score <?= $finished ? '' : 'pending' ?>">
            <?= $finished ? "{$f['home_goals']} – {$f['away_goals']}" : "vs" ?>
        </div>
        <div class="team">
            <?= $f['away_logo'] ? "<img src='{$f['away_logo']}' alt=''>" : "" ?>
            <span><?= htmlspecialchars($f['away_name']) ?></span>
        </div>
    </div>
    <div class="meta">
        <span><?= date('D d M Y · H:i', strtotime($f['date'])) ?> UTC</span>
        <?php if ($f['league_name']): ?>
            <span><?= htmlspecialchars($f['league_name']) ?></span>
        <?php endif; ?>
        <?php if ($f['round']): ?>
            <span><?= htmlspecialchars($f['round']) ?></span>
        <?php endif; ?>
        <span><?= htmlspecialchars($f['status_long'] ?? $f['status_short']) ?></span>
    </div>
</div>

<div class="content">

    <!-- Match Info -->
    <div class="card">
        <div class="card-header">
            <h2>Match Info</h2>
        </div>
        <div class="info-grid">
            <div class="info-item">
                <label>Date</label>
                <span><?= date('d M Y H:i', strtotime($f['date'])) ?> UTC</span>
            </div>
            <div class="info-item">
                <label>Referee</label>
                <span><?= htmlspecialchars($f['referee'] ?? '—') ?></span>
            </div>
            <div class="info-item">
                <label>Half Time</label>
                <span><?= ($f['ht_home'] !== null) ? "{$f['ht_home']} – {$f['ht_away']}" : '—' ?></span>
            </div>
            <div class="info-item">
                <label>Full Time</label>
                <span><?= ($f['ft_home'] !== null) ? "{$f['ft_home']} – {$f['ft_away']}" : '—' ?></span>
            </div>
            <?php if ($f['et_home'] !== null): ?>
            <div class="info-item">
                <label>Extra Time</label>
                <span><?= "{$f['et_home']} – {$f['et_away']}" ?></span>
            </div>
            <?php endif; ?>
            <?php if ($f['pen_home'] !== null): ?>
            <div class="info-item">
                <label>Penalties</label>
                <span><?= "{$f['pen_home']} – {$f['pen_away']}" ?></span>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Statistics -->
    <div class="card">
        <div class="card-header">
            <h2>Statistics</h2>
            <?php if ($home_stats && $away_stats): ?>
                <button class="copy-btn" id="copyBtn" onclick="copyForAI()">
                    📋 Copy for AI Analysis
                </button>
            <?php endif; ?>
        </div>

        <?php if ($home_stats && $away_stats): ?>

        <!-- Team name headers -->
        <div class="stat-row" style="margin-bottom:20px">
            <div style="flex:1;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <?= htmlspecialchars($f['home_name']) ?>
                <?= $f['home_logo'] ? "<img src='{$f['home_logo']}' height='20' style='object-fit:contain'>" : "" ?>
            </div>
            <div style="width:120px"></div>
            <div style="flex:1;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">
                <?= $f['away_logo'] ? "<img src='{$f['away_logo']}' height='20' style='object-fit:contain'>" : "" ?>
                <?= htmlspecialchars($f['away_name']) ?>
            </div>
        </div>

        <?php foreach ($stat_labels as $col => $label):
            $hv = $home_stats[$col] ?? null;
            $av = $away_stats[$col] ?? null;
            if ($hv === null && $av === null) continue;

            $h_num = (float) preg_replace('/[^0-9.]/', '', $hv ?? '0');
            $a_num = (float) preg_replace('/[^0-9.]/', '', $av ?? '0');
            $total = $h_num + $a_num;
            $h_pct = $total > 0 ? round(($h_num / $total) * 100) : 50;
            $a_pct = 100 - $h_pct;
        ?>
        <div class="stat-row">
            <div class="stat-val home"><?= htmlspecialchars((string)($hv ?? '—')) ?></div>
            <div class="stat-center">
                <div class="stat-label"><?= htmlspecialchars($label) ?></div>
                <div class="bar-wrap">
                    <div class="bar-home" style="width:<?= $h_pct ?>%"></div>
                    <div class="bar-away"  style="width:<?= $a_pct ?>%"></div>
                </div>
            </div>
            <div class="stat-val away"><?= htmlspecialchars((string)($av ?? '—')) ?></div>
        </div>
        <?php endforeach; ?>

        <?php else: ?>
            <p class="no-stats">Statistics not available for this fixture.</p>
        <?php endif; ?>
    </div>

</div>

<!-- Hidden textarea with pre-rendered AI text -->
<textarea id="aiText" style="position:absolute;left:-9999px;top:0;opacity:0" readonly><?= htmlspecialchars($ai_text) ?></textarea>

<script>
function copyForAI() {
    const textarea = document.getElementById('aiText');
    const btn      = document.getElementById('copyBtn');

    textarea.style.position = 'fixed';
    textarea.style.opacity  = '1';
    textarea.select();
    textarea.setSelectionRange(0, 99999);

    let success = false;
    try { success = document.execCommand('copy'); } catch(e) {}

    textarea.style.position = 'absolute';
    textarea.style.opacity  = '0';

    if (success) {
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '📋 Copy for AI Analysis';
            btn.classList.remove('copied');
        }, 2500);
    } else {
        navigator.clipboard.writeText(textarea.value).then(() => {
            btn.textContent = '✓ Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = '📋 Copy for AI Analysis';
                btn.classList.remove('copied');
            }, 2500);
        }).catch(() => {
            btn.textContent = '✗ Copy failed';
            btn.classList.add('failed');
            setTimeout(() => {
                btn.innerHTML = '📋 Copy for AI Analysis';
                btn.classList.remove('failed');
            }, 3000);
        });
    }
}
</script>

</body>
</html>
