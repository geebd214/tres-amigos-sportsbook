// File: src/utils/oddsApi.js
import { ODDS_API_KEY } from "../config/oddsApi.js";

export async function fetchAllOdds() {
  //const sports = ["basketball_nba", "americanfootball_nfl", "baseball_mlb"];
  const sports = ["baseball_mlb"];
  const allOdds = [];

  for (const sport of sports) {
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals`);
    if (!res.ok) throw new Error(`Failed to fetch odds for ${sport}`);
    const data = await res.json();
    allOdds.push(...data);
  }

  return allOdds;
}