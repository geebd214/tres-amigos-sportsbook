// File: updateResults.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fetch from 'node-fetch';
import { firebaseConfig } from './src/firebase.js';
import { ODDS_API_KEY } from './src/config/oddsApi.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchResults() {
  const res = await fetch(`https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?daysFrom=2&apiKey=${ODDS_API_KEY}`);
  const data = await res.json();
  return data;
}

async function updateBetResults() {
  const results = await fetchResults();
  const betsRef = collection(db, 'bets');
  const snapshot = await getDocs(betsRef);

  for (const docSnap of snapshot.docs) {
    const slip = docSnap.data();
    if (slip.status !== 'pending') continue;

    let allResolved = true;
    const updatedBets = slip.bets.map(bet => {
      const game = results.find(g => g.home_team.includes(bet.team) || g.away_team.includes(bet.team));
      if (!game || !game.completed) {
        allResolved = false;
        return bet;
      }

      const teamScore = game.home_team === bet.team ? game.scores.home_score : game.scores.away_score;
      const oppScore = game.home_team === bet.team ? game.scores.away_score : game.scores.home_score;

      const didWin = teamScore > oppScore;

      return {
        ...bet,
        result: didWin ? 'win' : 'lose'
      };
    });

    if (!allResolved) continue;

    const didWinAll = updatedBets.every(b => b.result === 'win');
    await updateDoc(doc(db, 'bets', docSnap.id), {
      status: didWinAll ? 'win' : 'lose',
      bets: updatedBets
    });
  }

  console.log('✅ Results updated.');
}

updateBetResults().catch(console.error);
