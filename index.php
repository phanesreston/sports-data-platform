<?php
require_once __DIR__ . '/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$teams   = $conn->query("SELECT id, name, code, country, founded, national, logo FROM teams ORDER BY name");
$leagues = $conn->query("SELECT id, name, type, logo, country_name, country_flag FROM leagues ORDER BY name");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Football Database</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body  { font-family: sans-serif; padding: 30px; background: #f5f5f5; color: #333; }
        h1    { font-size: 1.6rem; margin-bottom: 6px; }
        h2    { font-size: 1.1rem; margin: 30px 0 12px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 1px 4px rgba(0,0,0,.1); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
        th    { background: #222; color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
        td    { padding: 8px 14px; border-bottom: 1px solid #eee; vertical-align: middle; font-size: 14px; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f9f9f9; }
        a     { color: #1a73e8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #eee; color: #555; }
        .badge.cup { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>

<h1>Football Database</h1>

<h2>Leagues (<?= $leagues->num_rows ?>)</h2>
<table>
    <thead>
        <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Type</th>
            <th>Country</th>
        </tr>
    </thead>
    <tbody>
    <?php while ($row = $leagues->fetch_assoc()): ?>
        <tr>
            <td><?= $row['logo'] ? "<img src='{$row['logo']}' height='28'>" : "" ?></td>
            <td><a href="league.php?id=<?= $row['id'] ?>"><?= htmlspecialchars($row['name']) ?></a></td>
            <td><span class="badge <?= strtolower($row['type'] ?? '') ?>"><?= htmlspecialchars($row['type'] ?? '—') ?></span></td>
            <td><?= htmlspecialchars($row['country_name'] ?? '—') ?></td>
        </tr>
    <?php endwhile; ?>
    </tbody>
</table>

<h2>Teams (<?= $teams->num_rows ?>)</h2>
<table>
    <thead>
        <tr>
            <th>Logo</th>
            <th>Name</th>
            <th>Code</th>
            <th>Country</th>
            <th>Founded</th>
            <th>National Team</th>
        </tr>
    </thead>
    <tbody>
    <?php while ($row = $teams->fetch_assoc()): ?>
        <tr>
            <td><?= $row['logo'] ? "<img src='{$row['logo']}' height='28'>" : "" ?></td>
            <td><a href="team.php?id=<?= $row['id'] ?>"><?= htmlspecialchars($row['name']) ?></a></td>
            <td><?= htmlspecialchars($row['code'] ?? '') ?></td>
            <td><?= htmlspecialchars($row['country'] ?? '') ?></td>
            <td><?= $row['founded'] ?? '' ?></td>
            <td><?= $row['national'] ? 'Yes' : 'No' ?></td>
        </tr>
    <?php endwhile; ?>
    </tbody>
</table>

</body>
</html>
