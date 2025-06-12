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

The project is configured for Firebase Hosting. GitHub actions will build and
deploy on merges to the `main` branch.
