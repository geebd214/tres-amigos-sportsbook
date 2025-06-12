const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');
const dotenv = require('dotenv');

// Load environment variables from a local .env file if present
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const TEAMS = ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Heat', 'Nuggets', 'Suns', 'Mavericks', 'Grizzlies', 'Clippers'];
const MARKETS = ['moneyline', 'spreads', 'totals'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomOdds = () => {
  const odds = getRandomInt(-150, 150);
  return odds === 0 ? 100 : odds;
};
const getRandomWager = () => getRandomInt(50, 500);
const getRandomStatus = () => ['win', 'lose'][Math.floor(Math.random() * 2)];

const generateBet = () => {
  const numBets = getRandomInt(1, 3);
  const bets = [];
  for (let i = 0; i < numBets; i++) {
    bets.push({
      team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
      odds: getRandomOdds(),
      market: MARKETS[Math.floor(Math.random() * MARKETS.length)],
      spread: getRandomInt(-10, 10),
      total: getRandomInt(180, 240)
    });
  }
  return bets;
};

const fetchRealUsers = async () => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    return listUsersResult.users.map(user => ({
      id: user.uid,
      name: user.displayName || user.email || user.uid
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const generateHistoricalBets = async () => {
  console.log('Starting bet generation...');
  let totalBets = 0;

  // Fetch real users
  let users = [];
  try {
    users = await fetchRealUsers();
    if (!users.length) {
      console.error('No users found in Firebase Authentication!');
      return;
    }
    console.log(`Fetched ${users.length} users from Firebase Authentication.`);
  } catch (error) {
    console.error('Error fetching users:', error);
    return;
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  console.log(`Generating bets from ${sixMonthsAgo.toISOString()} to ${new Date().toISOString()}`);

  for (const user of users) {
    console.log(`\nGenerating bets for ${user.name} (${user.id})...`);
    let currentDate = new Date(sixMonthsAgo);
    while (currentDate < new Date()) {
      const betsThisWeek = getRandomInt(1, 3);
      for (let i = 0; i < betsThisWeek; i++) {
        const betData = {
          bets: generateBet(),
          wagerAmount: getRandomWager(),
          status: getRandomStatus(),
          createdAt: currentDate.toISOString(),
          userId: user.id,
          userName: user.name
        };
        console.log(`Adding bet for ${user.name} on ${currentDate.toISOString()}`);
        console.log('Bet data:', JSON.stringify(betData, null, 2));
        try {
          await addDoc(collection(db, 'bets'), betData);
          totalBets++;
          console.log('✅ Bet added successfully');
        } catch (error) {
          console.error('Error adding bet:', error);
        }
        currentDate.setDate(currentDate.getDate() + getRandomInt(1, 3));
      }
      currentDate.setDate(currentDate.getDate() + (7 - currentDate.getDay()));
    }
  }
  console.log(`\n✅ Successfully generated ${totalBets} bets`);
};

generateHistoricalBets()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 