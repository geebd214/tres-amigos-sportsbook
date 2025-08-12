# Tres Amigos Sportsbook

A demo sportsbook application built with **React**, **Vite** and **Firebase**.
Users can sign in with Google, view current game odds from the Odds API and
submit parlay style bets. An admin view allows manual adjustment of bet results.

## Features

- Google authentication via Firebase
- Display of live odds with moneyline, spread and total markets
- Betting slip with parlay calculations
- Personal dashboard showing winnings over time
- Admin page to update or remove submitted bets

## Local Development

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Firebase credentials. An Odds
   API key should be configured in `src/config/oddsApi.js`.

3. Start the development server

   ```bash
   npm run dev
   ```

The app will be available at [http://localhost:5173](http://localhost:5173) by
default.

## Additional Scripts

See [`docs/scripts.md`](docs/scripts.md) for a description of the helper scripts
found in the `scripts/` directory.

## Deployment

Deploy via Firebase CLI or GitHub Actions.

Manual (CLI):

1. Install tools and login
   
   ```bash
   npm ci
   npm i -g firebase-tools
   firebase login
   ```

2. Select the project (repo is preconfigured)
   
   ```bash
   firebase use tres-amigos-sportsbook   # or your project id
   ```

3. Provide build-time env (Vite)
   
   Add to `.env` or export before build:
   
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
   - Optional: `VITE_ODDS_API_KEY` (client odds fetching)

4. Build and deploy
   
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

Preview channels (temporary URLs):

```bash
firebase hosting:channel:deploy my-feature-123
```

CI (GitHub Actions):

- On pushes to `main`, the workflow builds and deploys to Hosting.
- Required repo secrets: `FIREBASE_SERVICE_ACCOUNT` (JSON), and all `VITE_FIREBASE_*` values shown above. Optionally add `VITE_ODDS_API_KEY` if needed by the client.
