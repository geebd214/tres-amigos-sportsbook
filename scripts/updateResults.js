// scripts/updateResults.js
import fs from 'fs';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fetchScoresFromOddsAPI } from './oddsApi.node.js';

// Load Firebase Admin credentials
const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));

// Initialize Firebase Admin
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function isBetWinning(bet, finalScore) {
  const { marketType, team, point, outcome } = bet;
  const { home_team, away_team, scores } = finalScore;

  const homeScore = scores?.[home_team]?.score ?? 0;
  const awayScore = scores?.[away_team]?.score ?? 0;

  if (marketType === 'moneyline') {
    const winner = homeScore > awayScore ? home_team : away_team;
    return team === winner;
  }

  if (marketType === 'spreads') {
    const isHome = team === home_team;
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    return (teamScore + point) > oppScore;
  }

  if (marketType === 'totals') {
    const total = homeScore + awayScore;
    return outcome === 'over' ? total > point : total < point;
  }

  return false;
}

async function updateBetResults() {
  const gameMap = await fetchScoresFromOddsAPI();
  //console.log('📦 Raw scores from Odds API:', JSON.stringify(gameMap, null, 2));

  const betsRef = db.collection('bets');
  const snapshot = await betsRef.get()

  for (const betDoc of snapshot.docs) {
    const slip = betDoc.data();
    if (!Array.isArray(slip.bets)) {
      console.error('❌ slip.bets is not an array', slip);
      continue;
    }

    let allResolved = true;
    let allWon = true;

    const updatedBets = slip.bets.map((bet, index) => {
      if (!bet?.gameId) {
        console.warn(`⚠️ Skipping invalid bet[${index}]`, bet);
        allResolved = false;
        return bet;
      }

      const game = gameMap[bet.gameId];
      if (!game || !game.completed) {
        allResolved = false;
        console.log(`⚠️ Still pending bet[${index}]`, bet);
        return bet;
      }

      const won = isBetWinning(bet, game);
      console.log(`Result bet[${index}]`, bet, won ? 'win' : 'lose');
      if (!won) allWon = false;
      
      return { ...bet, result: won ? 'win' : 'lose' };
    });

    if (allResolved) {
      await betDoc.ref.update({
        bets: updatedBets,
        status: allWon ? 'win' : 'lose'
      });
    }
  }

  console.log('✅ Bet results updated.');
}

updateBetResults().catch(console.error);
