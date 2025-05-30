// src/services/oddsApi.js
import { ODDS_API_KEY } from "../config/oddsApi";

const API_KEY = ODDS_API_KEY;

export const fetchOdds = async (sportKey) => {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${API_KEY}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch odds data');
    }
    return response.json();
  };
  