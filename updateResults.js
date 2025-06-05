// File: updateResults.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from './src/firebase.js';
import { fetchAllOdds } from './src/utils/oddsApi.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchResults() {
  const allOdds = await fetchAllOdds();
  // Filter to completed games only with score data if needed
  return allOdds.filter(g => g.scores && g.completed);
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
      const game = results.find(g =>
        g.home_team.includes(bet.team) || g.away_team.includes(bet.team)
      );

      if (!game || !game.completed) {
        allResolved = false;
        return bet;
      }

      const teamScore = game.home_team === bet.team ? game.scores.home_score : game.scores.away_score;
      const oppScore = game.home_team === bet.team ? game.scores.away_score : game.scores.home_score;

      const didWin = teamScore > oppScore;

      return {
        ...bet,
        result: didWin ? 'win' : 'lose',
      };
    });

    if (!allResolved) continue;

    const didWinAll = updatedBets.every(b => b.result === 'win');
    await updateDoc(doc(db, 'bets', docSnap.id), {
      status: didWinAll ? 'win' : 'lose',
      bets: updatedBets,
    });
  }

  console.log('✅ Results updated.');
}

updateBetResults().catch(console.error);
