// src/config/oddsApi.client.js

const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY || '';

console.log("🔑 [CLIENT] Using ODDS API Key:", ODDS_API_KEY);

export { ODDS_API_KEY };