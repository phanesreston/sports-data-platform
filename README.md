# Sports Data Platform

Backend system for ingesting, normalizing, and exposing Premier League football data from FBref.

## Project Goals
- Ingest a defined subset of Premier League data from FBref
- Normalize messy real-world data into a consistent relational schema
- Expose read-only API endpoints

## V1 Scope
**Data source**
- FBref (Premier League)

**V1 will do**
- Ingest Premier League player season stats for one season
- Store normalized data (players, teams, seasons, stats)
- Expose read-only API endpoints

**V1 will NOT do**
- Real-time updates, authentication, UI, AI/predictions

## High-Level Architecture
Scraper → Normalizer → Database → API

## Tech Stack (initial)
Python, FastAPI, SQLite/Postgres, Docker
