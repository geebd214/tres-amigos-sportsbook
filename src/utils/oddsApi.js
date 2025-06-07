// File: src/utils/oddsApi.js
import { ODDS_API_KEY } from "../config/oddsApi.js";

export async function fetchAllOdds() {
  //const sports = ["basketball_nba", "americanfootball_nfl", "baseball_mlb"];
  const sports = ["baseball_mlb"];
  const allOdds = [];

  for (const sport of sports) {
    try {
      console.log(`Fetching odds for ${sport}`);
      const res = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to fetch odds for ${sport}:`, errorText);
        throw new Error(`Failed to fetch odds for ${sport}: ${errorText}`);
      }

      const data = await res.json();
      console.log(`Successfully fetched ${data.length} games for ${sport}`);
      allOdds.push(...data);
    } catch (error) {
      console.error(`Error fetching odds for ${sport}:`, error);
      throw error;
    }
  }

  if (allOdds.length === 0) {
    console.warn('No odds data received from API');
  } else {
    console.log(`Total games fetched: ${allOdds.length}`);
  }

  return allOdds;
}