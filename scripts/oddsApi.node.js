import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { ODDS_API_KEY } from "../src/config/oddsApi.js";
import { debug } from "../src/utils/debug.js";

const CACHE_DIR = path.resolve('cache/scores');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
//const SPORTS = ['basketball_nba', 'football_nfl', 'baseball_mlb'];
const SPORTS = ['baseball_mlb']

async function readSportCache(sport) {
  try {
    const file = path.join(CACHE_DIR, `${sport}.json`);
    const data = await fs.readFile(file, 'utf-8');
    console.log('📦 Using CACHED scores');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeSportCache(sport, games) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${sport}.json`);
  const payload = {
    lastFetched: new Date().toISOString(),
    games
  };
  await fs.writeFile(file, JSON.stringify(payload, null, 2));
}

function isFresh(timestamp) {
  return (Date.now() - new Date(timestamp).getTime()) < CACHE_TTL_MS;
}

function allGamesComplete(gameMap) {
  return Object.values(gameMap).every(g => g.completed === true);
}

async function fetchScoresForSport(sportKey, daysFrom = 2) {
  console.log('🍏🍊 Getting FRESH scores');
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?daysFrom=${daysFrom}&apiKey=${ODDS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`❌ Failed to fetch ${sportKey}: ${res.statusText}`);
    return {};
  }

  const rawGames = await res.json();
  const gameMap = {};

  for (const game of rawGames) {
    gameMap[game.id] = {
      id: game.id,
      completed: game.completed,
      home_team: game.home_team,
      away_team: game.away_team,
      lastFetched: new Date().toISOString(),
      scores: {
        [game.home_team]: { score: game.scores?.[0]?.score ?? 0 },
        [game.away_team]: { score: game.scores?.[1]?.score ?? 0 }
      }
    };
  }

  return gameMap;
}

export async function fetchScoresFromOddsAPI(daysFrom = 2) {
  const combinedGames = {};

  for (const sport of SPORTS) {
    const cached = await readSportCache(sport);

    let useCache = false;
    if (cached && isFresh(cached.lastFetched)) {
      if (allGamesComplete(cached.games)) {
        useCache = true;
        console.log(`✅ Using fresh cache for ${sport}`);
      } else {
        console.log(`♻️ Partial cache for ${sport} — some games incomplete`);
      }
      Object.assign(combinedGames, cached.games);
      continue;
    } else {
      console.log(`🕒 Cache missing/stale for ${sport}`);
    }

    const freshGames = await fetchScoresForSport(sport, daysFrom);
    Object.assign(combinedGames, freshGames);
    await writeSportCache(sport, freshGames);
  }

  return combinedGames;
}
