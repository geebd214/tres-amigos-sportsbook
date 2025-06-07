import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { fetchAllOdds } from "../utils/oddsApi";

const ODDS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useUserBets(user) {
  const [myBets, setMyBets] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "bets"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyBets(bets);
    });
    return () => unsubscribe();
  }, [user]);

  return { myBets, setMyBets };
}

export function useCachedOdds(selectedDate) {
  const [oddsData, setOddsData] = useState(null);
  const [oddsLastUpdated, setOddsLastUpdated] = useState(null);

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        const ref = doc(db, "meta", "odds_cache");
        const snapshot = await getDoc(ref);
        const now = Date.now();

        if (snapshot.exists()) {
          const { data, timestamp } = snapshot.data();
          const age = now - timestamp.toMillis();
          if (age < ODDS_CACHE_TTL) {
            setOddsData(data);
            setOddsLastUpdated(new Date(timestamp.toMillis()));
            return;
          }
        }

        const data = await fetchAllOdds();
        await setDoc(ref, { 
          data, 
          timestamp: serverTimestamp(),
          lastUpdated: new Date().toISOString()
        });
        setOddsData(data);
        setOddsLastUpdated(new Date());
      } catch (err) {
        console.error("Error fetching odds:", err);
      }
    };

    fetchOdds();
  }, [selectedDate]);

  return { oddsData, oddsLastUpdated };
}

export function useWinningsChartData(myBets, timeFilter) {
  const timeRanges = { "1d": 1, "1w": 7, "1m": 30, "1y": 365, "all": Infinity };

  return myBets
    .filter(bet => bet.status === "win" || bet.status === "lose")
    .filter(bet => {
      if (timeFilter === "all" || !bet.createdAt?.toDate) return true;
      const days = timeRanges[timeFilter];
      const diff = (new Date() - bet.createdAt.toDate()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    })
    .sort((a, b) => a.createdAt?.toDate() - b.createdAt?.toDate())
    .reduce((acc, bet) => {
      const date = bet.createdAt?.toDate().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
      const parlayOdds = bet.bets?.reduce((oAcc, b) => {
        const dec = b.odds > 0 ? b.odds / 100 + 1 : 100 / Math.abs(b.odds) + 1;
        return oAcc * dec;
      }, 1) ?? 1;
      const change = bet.status === "win"
        ? bet.wagerAmount * parlayOdds
        : -bet.wagerAmount;
      const last = acc.length > 0 ? acc[acc.length - 1].total : 0;
      acc.push({ name: date, total: last + change });
      return acc;
    }, []);
}

export function useFilteredBets(myBets, statusFilter) {
  return myBets.filter(bet => {
    if (statusFilter === "all") return true;
    return bet.status === statusFilter;
  });
}

export async function getAllBets() {
  const snapshot = await getDocs(collection(db, "bets"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createBet(bet) {
  const docRef = await addDoc(collection(db, "bets"), { ...bet, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function updateBet(betId, updates) {
  const ref = doc(db, "bets", betId);
  await updateDoc(ref, updates);
} 