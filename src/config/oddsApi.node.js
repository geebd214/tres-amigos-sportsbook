// src/config/oddsApi.node.js

import dotenv from 'dotenv';
dotenv.config();

const ODDS_API_KEY = process.env.ODDS_API_KEY || '';

console.log("🔑 [NODE] Using ODDS API Key:", ODDS_API_KEY);

export { ODDS_API_KEY };