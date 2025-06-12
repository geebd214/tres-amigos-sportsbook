// src/config/oddsApi.js
// Load the Odds API key from environment variables so keys are not committed
// to source control. The value will be pulled from the Node environment when
// running scripts or from Vite's injected variables in the browser.

const nodeKey =
  typeof process !== 'undefined' ? process.env.ODDS_API_KEY : undefined;
const browserKey =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ODDS_API_KEY : undefined;

export const ODDS_API_KEY = nodeKey || browserKey || "";
