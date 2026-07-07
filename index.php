<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$view    = $_GET['view'] ?? 'leagues';
$page    = max(1, intval($_GET['page'] ?? 1));
$perPage = 25;
$offset  = ($page - 1) * $perPage;

// ── data fetch ────────────────────────────────────────────────────────────────

if ($view === 'teams') {
    $search = trim($_GET['q'] ?? '');
    $where  = $search ? "WHERE name LIKE '%" . $conn->real_escape_string($search) . "%'" : '';
    $total  = $conn->query("SELECT COUNT(*) FROM teams $where")->fetch_row()[0];
    $rows   = $conn->query("SELECT id, name, code, country, founded, national, logo FROM teams $where ORDER BY name LIMIT $perPage OFFSET $offset")->fetch_all(MYSQLI_ASSOC);

} elseif ($view === 'fixtures') {
    $search = trim($_GET['q'] ?? '');
    $where  = $search
        ? "WHERE (ht.name LIKE '%" . $conn->real_escape_string($search) . "%' OR at.name LIKE '%" . $conn->real_escape_string($search) . "%')"
        : '';
    $total  = $conn->query("SELECT COUNT(*) FROM fixtures f JOIN teams ht ON ht.id = f.home_team_id JOIN teams at ON at.id = f.away_team_id $where")->fetch_row()[0];
    $rows   = $conn->query("
        SELECT f.id, f.date, f.round, f.status_short, f.home_goals, f.away_goals,
               ht.name AS home_name, ht.logo AS home_logo,
               at.name AS away_name, at.logo AS away_logo,
               l.name AS league_name
        FROM fixtures f
        JOIN teams ht  ON ht.id = f.home_team_id
        JOIN teams at  ON at.id = f.away_team_id
        LEFT JOIN leagues l ON l.id = f.league_id
        $where
        ORDER BY f.date DESC
        LIMIT $perPage OFFSET $offset
    ")->fetch_all(MYSQLI_ASSOC);

} elseif ($view === 'players') {
    $search = trim($_GET['q'] ?? '');
    $where  = $search ? "WHERE p.name LIKE '%" . $conn->real_escape_string($search) . "%' OR p.nationality LIKE '%" . $conn->real_escape_string($search) . "%'" : '';
    $total  = $conn->query("SELECT COUNT(DISTINCT p.id) FROM players p $where")->fetch_row()[0];
    $rows   = $conn->query("
        SELECT p.id, p.name, p.nationality, p.photo,
               ps.position, ps.season,
               t.name AS team_name, t.logo AS team_logo
        FROM players p
        LEFT JOIN player_stats ps ON ps.player_id = p.id
        LEFT JOIN teams t ON t.id = ps.team_id
        $where
        GROUP BY p.id
        ORDER BY p.name
        LIMIT $perPage OFFSET $offset
    ")->fetch_all(MYSQLI_ASSOC);

} else {
    $view   = 'leagues';
    $search = trim($_GET['q'] ?? '');
    $where  = $search ? "WHERE name LIKE '%" . $conn->real_escape_string($search) . "%'" : '';
    $total  = $conn->query("SELECT COUNT(*) FROM leagues $where")->fetch_row()[0];
    $rows   = $conn->query("SELECT id, name, type, logo, country_name, country_flag FROM leagues $where ORDER BY name LIMIT $perPage OFFSET $offset")->fetch_all(MYSQLI_ASSOC);
}

$pages = max(1, (int) ceil($total / $perPage));

function pageUrl($p) {
    $params = $_GET;
    $params['page'] = $p;
    return '?' . http_build_query($params);
}
function viewUrl($v) {
    return '?view=' . $v;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Football Database</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; background: #f0f2f5; color: #333; min-height: 100vh; }

        /* ── Nav ── */
        .navbar {
            background: #111;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 24px;
            height: 54px;
            gap: 32px;
        }
        .nav-brand {
            font-size: 1rem;
            font-weight: 800;
            color: white;
            text-decoration: none;
            letter-spacing: -0.02em;
            white-space: nowrap;
        }
        .nav-links { display: flex; gap: 4px; }
        .nav-links a {
            color: #aaa;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 6px;
            transition: all 0.15s;
        }
        .nav-links a:hover      { color: white; background: #222; }
        .nav-links a.active     { color: white; background: #1a73e8; }

        /* ── Page shell ── */
        .shell {
            max-width: 1000px;
            margin: 30px auto;
            padding: 0 20px;
        }

        /* ── Toolbar ── */
        .toolbar {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .toolbar h1 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #333;
            flex: 1;
        }
        .toolbar .count { font-size: 13px; color: #888; }
        .search-wrap { position: relative; }
        .search-wrap input {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 7px 12px 7px 34px;
            font-size: 14px;
            width: 220px;
            outline: none;
            background: white;
        }
        .search-wrap input:focus { border-color: #1a73e8; }
        .search-wrap::before {
            content: '🔍';
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            pointer-events: none;
        }

        /* ── Card table ── */
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 1px 4px rgba(0,0,0,.08);
            overflow: hidden;
        }
        table { border-collapse: collapse; width: 100%; }
        th {
            background: #fafafa;
            padding: 10px 16px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #999;
            border-bottom: 1px solid #eee;
            white-space: nowrap;
        }
        td {
            padding: 10px 16px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
            vertical-align: middle;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #fafcff; }
        a.row-link { color: #1a73e8; text-decoration: none; font-weight: 600; }
        a.row-link:hover { text-decoration: underline; }

        /* ── Badges ── */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            background: #eee;
            color: #666;
        }
        .badge.cup    { background: #fff3cd; color: #856404; }
        .badge.league { background: #d4edda; color: #155724; }
        .pill { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .pill.ft   { background: #d4edda; color: #155724; }
        .pill.ns   { background: #fff3cd; color: #856404; }
        .pill.live { background: #f8d7da; color: #721c24; }

        /* ── Score ── */
        .score-box {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 14px;
            background: #222;
            color: white;
            white-space: nowrap;
        }
        .score-box.ns { background: #fff3cd; color: #856404; font-weight: 600; font-size: 12px; }

        /* ── Match cell ── */
        .match-cell { display: flex; align-items: center; gap: 10px; }
        .team-pair  { display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
        .team-row   { display: flex; align-items: center; gap: 6px; }
        .team-row img { width: 18px; height: 18px; object-fit: contain; }

        /* ── Pagination ── */
        .pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            border-top: 1px solid #eee;
            background: #fafafa;
        }
        .pagination .info { font-size: 13px; color: #888; }
        .pag-btns { display: flex; gap: 4px; }
        .pag-btns a, .pag-btns span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            height: 32px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            padding: 0 8px;
        }
        .pag-btns a        { color: #333; background: white; border: 1px solid #ddd; }
        .pag-btns a:hover  { background: #f0f0f0; }
        .pag-btns span     { background: #1a73e8; color: white; border: 1px solid #1a73e8; }
        .pag-btns .disabled { color: #ccc; background: white; border: 1px solid #eee; pointer-events: none; }

        .empty { text-align: center; color: #aaa; padding: 48px; font-size: 14px; }
    </style>
</head>
<body>

<nav class="navbar">
    <a href="index.php" class="nav-brand">⚽ Football DB</a>
    <div class="nav-links">
        <a href="<?= viewUrl('leagues') ?>" class="<?= $view==='leagues'?'active':'' ?>">🏆 Leagues</a>
        <a href="<?= viewUrl('teams')   ?>" class="<?= $view==='teams'  ?'active':'' ?>">👥 Teams</a>
        <a href="<?= viewUrl('fixtures')?>" class="<?= $view==='fixtures'?'active':'' ?>">📅 Fixtures</a>
        <a href="<?= viewUrl('players') ?>" class="<?= $view==='players'?'active':'' ?>">🧑 Players</a>
    </div>
</nav>

<div class="shell">

    <div class="toolbar">
        <h1>
            <?= $view === 'leagues' ? 'Leagues' : ($view === 'teams' ? 'Teams' : ($view === 'fixtures' ? 'Fixtures' : 'Players')) ?>
        </h1>
        <span class="count"><?= number_format($total) ?> total</span>
        <form method="get" class="search-wrap" style="margin:0">
            <input type="hidden" name="view" value="<?= htmlspecialchars($view) ?>">
            <input type="text" name="q" value="<?= htmlspecialchars($_GET['q'] ?? '') ?>"
                   placeholder="Search..." onchange="this.form.submit()">
        </form>
    </div>

    <div class="card">

    <?php if (empty($rows)): ?>
        <div class="empty">No results found.</div>

    <?php elseif ($view === 'leagues'): ?>
        <table>
            <thead><tr>
                <th>Logo</th><th>Name</th><th>Type</th><th>Country</th>
            </tr></thead>
            <tbody>
            <?php foreach ($rows as $r): ?>
            <tr>
                <td><?= $r['logo'] ? "<img src='{$r['logo']}' height='26' style='object-fit:contain'>" : '' ?></td>
                <td><a class="row-link" href="league.php?id=<?= $r['id'] ?>"><?= htmlspecialchars($r['name']) ?></a></td>
                <td><span class="badge <?= strtolower($r['type'] ?? '') ?>"><?= htmlspecialchars($r['type'] ?? '—') ?></span></td>
                <td><?= htmlspecialchars($r['country_name'] ?? '—') ?></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

    <?php elseif ($view === 'teams'): ?>
        <table>
            <thead><tr>
                <th>Logo</th><th>Name</th><th>Code</th><th>Country</th><th>Founded</th><th>National</th>
            </tr></thead>
            <tbody>
            <?php foreach ($rows as $r): ?>
            <tr>
                <td><?= $r['logo'] ? "<img src='{$r['logo']}' height='26' style='object-fit:contain'>" : '' ?></td>
                <td><a class="row-link" href="team.php?id=<?= $r['id'] ?>"><?= htmlspecialchars($r['name']) ?></a></td>
                <td style="color:#888"><?= htmlspecialchars($r['code'] ?? '') ?></td>
                <td><?= htmlspecialchars($r['country'] ?? '') ?></td>
                <td><?= $r['founded'] ?? '' ?></td>
                <td><?= $r['national'] ? 'Yes' : '' ?></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

    <?php elseif ($view === 'fixtures'): ?>
        <table>
            <thead><tr>
                <th>Date</th><th>Match</th><th>Score</th><th>Competition</th><th>Status</th>
            </tr></thead>
            <tbody>
            <?php foreach ($rows as $r):
                $finished = in_array($r['status_short'], ['FT','AET','PEN']);
                $live     = in_array($r['status_short'], ['1H','2H','HT','ET','P']);
                $pill     = $finished ? 'ft' : ($live ? 'live' : 'ns');
            ?>
            <tr>
                <td style="white-space:nowrap;color:#888;font-size:12px">
                    <?= date('d M Y', strtotime($r['date'])) ?><br>
                    <?= date('H:i', strtotime($r['date'])) ?> UTC
                </td>
                <td>
                    <a class="row-link" href="fixture.php?id=<?= $r['id'] ?>" style="font-weight:normal;color:inherit;display:block">
                        <div class="team-pair">
                            <div class="team-row">
                                <?= $r['home_logo'] ? "<img src='{$r['home_logo']}'>" : '' ?>
                                <span style="font-weight:600"><?= htmlspecialchars($r['home_name']) ?></span>
                            </div>
                            <div class="team-row">
                                <?= $r['away_logo'] ? "<img src='{$r['away_logo']}'>" : '' ?>
                                <span style="font-weight:600"><?= htmlspecialchars($r['away_name']) ?></span>
                            </div>
                        </div>
                    </a>
                </td>
                <td>
                    <?php if ($finished): ?>
                        <span class="score-box"><?= $r['home_goals'] ?> – <?= $r['away_goals'] ?></span>
                    <?php elseif ($live): ?>
                        <span class="score-box"><?= $r['home_goals'] ?>–<?= $r['away_goals'] ?> 🔴</span>
                    <?php else: ?>
                        <span class="score-box ns"><?= date('H:i', strtotime($r['date'])) ?></span>
                    <?php endif; ?>
                </td>
                <td style="font-size:13px;color:#666"><?= htmlspecialchars($r['league_name'] ?? '—') ?></td>
                <td><span class="pill <?= $pill ?>"><?= $r['status_short'] ?></span></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>

    <?php elseif ($view === 'players'): ?>
        <table>
            <thead><tr>
                <th>Photo</th><th>Name</th><th>Nationality</th><th>Position</th><th>Team</th><th>Season</th>
            </tr></thead>
            <tbody>
            <?php foreach ($rows as $r): ?>
            <tr>
                <td>
                    <?php if ($r['photo']): ?>
                        <img src="<?= htmlspecialchars($r['photo']) ?>" height="32" width="32"
                             style="border-radius:50%;object-fit:cover">
                    <?php endif; ?>
                </td>
                <td><a class="row-link" href="player.php?id=<?= $r['id'] ?>"><?= htmlspecialchars($r['name']) ?></a></td>
                <td style="color:#666"><?= htmlspecialchars($r['nationality'] ?? '—') ?></td>
                <td style="color:#666"><?= htmlspecialchars($r['position'] ?? '—') ?></td>
                <td>
                    <?php if ($r['team_name']): ?>
                        <div class="team-row" style="gap:6px">
                            <?= $r['team_logo'] ? "<img src='{$r['team_logo']}' style='width:18px;height:18px;object-fit:contain'>" : '' ?>
                            <span style="font-size:13px"><?= htmlspecialchars($r['team_name']) ?></span>
                        </div>
                    <?php else: ?>
                        <span style="color:#aaa">—</span>
                    <?php endif; ?>
                </td>
                <td style="color:#888;font-size:13px"><?= $r['season'] ?? '—' ?></td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>

    <!-- Pagination -->
    <?php if ($pages > 1): ?>
    <div class="pagination">
        <span class="info">
            Page <?= $page ?> of <?= $pages ?>
            · showing <?= number_format($offset + 1) ?>–<?= number_format(min($offset + $perPage, $total)) ?>
            of <?= number_format($total) ?>
        </span>
        <div class="pag-btns">
            <?php if ($page <= 1): ?>
                <span class="disabled">‹ Prev</span>
            <?php else: ?>
                <a href="<?= pageUrl($page - 1) ?>">‹ Prev</a>
            <?php endif; ?>

            <?php
            $start = max(1, $page - 2);
            $end   = min($pages, $page + 2);
            if ($start > 1)      echo '<a href="' . pageUrl(1) . '">1</a>';
            if ($start > 2)      echo '<span style="padding:0 4px;color:#ccc">…</span>';
            for ($i = $start; $i <= $end; $i++):
                if ($i === $page): ?>
                    <span><?= $i ?></span>
                <?php else: ?>
                    <a href="<?= pageUrl($i) ?>"><?= $i ?></a>
                <?php endif;
            endfor;
            if ($end < $pages - 1) echo '<span style="padding:0 4px;color:#ccc">…</span>';
            if ($end < $pages)     echo '<a href="' . pageUrl($pages) . '">' . $pages . '</a>';
            ?>

            <?php if ($page >= $pages): ?>
                <span class="disabled">Next ›</span>
            <?php else: ?>
                <a href="<?= pageUrl($page + 1) ?>">Next ›</a>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>

    </div><!-- .card -->
</div><!-- .shell -->
</body>
</html>
