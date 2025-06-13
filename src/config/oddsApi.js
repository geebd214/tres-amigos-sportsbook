// src/config/oddsApi.js
// Load the Odds API key from environment variables so keys are not committed
// to source control. The value will be pulled from the Node environment when
// running scripts or from Vite's injected variables in the browser.
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let ODDS_API_KEY = '';

if (typeof process !== 'undefined' && process.env?.ODDS_API_KEY) {
  ODDS_API_KEY = process.env.ODDS_API_KEY;
} else if (typeof import.meta !== 'undefined') {
  ODDS_API_KEY = import.meta.env?.VITE_ODDS_API_KEY || '';
}

// Log API key
console.log('🔑 Using ODDS API Key:', ODDS_API_KEY);

export { ODDS_API_KEY };
