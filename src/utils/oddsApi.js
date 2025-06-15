// File: src/utils/oddsApi.js
import { ODDS_API_KEY } from "../config/oddsApi.client.js";
import { debug } from "./debug.js";

//const SPORTS = ['basketball_nba', 'football_nfl', 'baseball_mlb'];
const SPORTS = ["baseball_mlb"];

export async function fetchAllOdds() {
  const allOdds = [];

  for (const sport of SPORTS) {
    try {
      debug.info(`Fetching odds for ${sport}`);
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals`,
      );

      if (!res.ok) {
        const errorText = await res.text();
        debug.error(`Failed to fetch odds for ${sport}:`, errorText);
        throw new Error(`Failed to fetch odds for ${sport}: ${errorText}`);
      }

      const data = await res.json();
      debug.info(`Successfully fetched ${data.length} games for ${sport}`);
      allOdds.push(...data);
    } catch (error) {
      debug.error(`Error fetching odds for ${sport}:`, error);
      throw error;
    }
  }

  if (allOdds.length === 0) {
    debug.warn("No odds data received from API");
  } else {
    debug.info(`Total games fetched: ${allOdds.length}`);
  }

  return allOdds;
}
