-- Full schema for api_football database.
-- Run once on a fresh install: mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS api_football;
USE api_football;

CREATE TABLE IF NOT EXISTS teams (
    id       INT PRIMARY KEY,
    name     VARCHAR(200) NOT NULL,
    code     VARCHAR(10),
    country  VARCHAR(100),
    founded  INT,
    national TINYINT(1) DEFAULT 0,
    logo     VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS venues (
    id       INT PRIMARY KEY,
    team_id  INT,
    name     VARCHAR(200),
    address  VARCHAR(300),
    city     VARCHAR(100),
    capacity INT,
    surface  VARCHAR(50),
    image    VARCHAR(500),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS leagues (
    id           INT PRIMARY KEY,
    name         VARCHAR(100),
    type         VARCHAR(50),
    logo         VARCHAR(500),
    country_name VARCHAR(100),
    country_code VARCHAR(10),
    country_flag VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS league_seasons (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    league_id      INT NOT NULL,
    year           INT NOT NULL,
    start_date     VARCHAR(20),
    end_date       VARCHAR(20),
    current_season TINYINT(1) DEFAULT 0,
    UNIQUE KEY (league_id, year),
    FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS fixtures (
    id             INT PRIMARY KEY,
    league_id      INT,
    season         INT,
    round          VARCHAR(100),
    referee        VARCHAR(200),
    date           VARCHAR(50),
    timestamp      INT,
    status_short   VARCHAR(20),
    status_long    VARCHAR(100),
    status_elapsed INT,
    home_team_id   INT,
    away_team_id   INT,
    home_goals     INT,
    away_goals     INT,
    home_winner    TINYINT(1),
    away_winner    TINYINT(1),
    ht_home INT, ht_away INT,
    ft_home INT, ft_away INT,
    et_home INT, et_away INT,
    pen_home INT, pen_away INT,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),
    FOREIGN KEY (league_id)    REFERENCES leagues(id)
);

CREATE TABLE IF NOT EXISTS fixture_statistics (
    fixture_id       INT NOT NULL,
    team_id          INT NOT NULL,
    shots_on_goal    INT,
    shots_off_goal   INT,
    total_shots      INT,
    blocked_shots    INT,
    shots_insidebox  INT,
    shots_outsidebox INT,
    fouls            INT,
    corner_kicks     INT,
    offsides         INT,
    ball_possession  VARCHAR(10),
    yellow_cards     INT,
    red_cards        INT,
    goalkeeper_saves INT,
    total_passes     INT,
    passes_accurate  INT,
    passes_pct       VARCHAR(10),
    expected_goals   DECIMAL(5,2),
    goals_prevented  DECIMAL(5,2),
    PRIMARY KEY (fixture_id, team_id),
    FOREIGN KEY (fixture_id) REFERENCES fixtures(id),
    FOREIGN KEY (team_id)    REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS players (
    id          INT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    firstname   VARCHAR(100),
    lastname    VARCHAR(100),
    age         INT,
    nationality VARCHAR(100),
    height      VARCHAR(20),
    weight      VARCHAR(20),
    photo       VARCHAR(500),
    updated_at  BIGINT
);

CREATE TABLE IF NOT EXISTS team_players (
    team_id   INT NOT NULL,
    player_id INT NOT NULL,
    season    INT NOT NULL,
    PRIMARY KEY (team_id, player_id, season),
    FOREIGN KEY (team_id)   REFERENCES teams(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS player_stats (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    player_id           INT NOT NULL,
    team_id             INT,
    league_id           INT,
    season              INT,
    position            VARCHAR(50),
    rating              DECIMAL(4,2),
    captain             TINYINT(1) DEFAULT 0,
    appearances         INT,
    lineups             INT,
    minutes             INT,
    goals               INT,
    assists             INT,
    saves               INT,
    conceded            INT,
    shots_total         INT,
    shots_on            INT,
    passes_total        INT,
    passes_key          INT,
    passes_accuracy     INT,
    tackles_total       INT,
    blocks              INT,
    interceptions       INT,
    duels_total         INT,
    duels_won           INT,
    dribbles_attempts   INT,
    dribbles_success    INT,
    fouls_drawn         INT,
    fouls_committed     INT,
    yellow_cards        INT,
    yellowred_cards     INT,
    red_cards           INT,
    penalty_won         INT,
    penalty_committed   INT,
    penalty_scored      INT,
    penalty_missed      INT,
    penalty_saved       INT,
    UNIQUE KEY (player_id, team_id, league_id, season),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id)   REFERENCES teams(id),
    FOREIGN KEY (league_id) REFERENCES leagues(id)
);
