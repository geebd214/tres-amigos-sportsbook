# Project Scripts

This project includes a few Node.js scripts located in the `scripts/` folder.
They are primarily used when working with Firebase or fetching data from the
Odds API.

| Script | Description |
| ------ | ----------- |
| `generateFakeBets.cjs` | Seeds Firestore with random historical bets for testing. Requires access to your Firebase project and a service account JSON file. |
| `oddsApi.node.js` | Fetches scores from the Odds API and caches them locally. Used by other scripts to avoid redundant API calls. |
| `setAdminClaim.cjs` | Adds the `admin: true` custom claim to a Firebase user. Run with the user's email address as an argument. |
| `updateResults.js` | Looks up game results from the Odds API and updates bet documents in Firestore. |

Run each script with `node` from the project root. Most scripts expect a
`service-account.json` file containing Firebase Admin credentials and a valid
Odds API key configured in `src/config/oddsApi.js`.
