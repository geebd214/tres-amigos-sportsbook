// File: pages/MakeBets.jsx

import { useState } from "react";
import OddsBoard from "../components/OddsBoard";
import BettingSlip from "../components/BettingSlip";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

const SPORTS = [
  { label: "NBA", key: "basketball_nba" },
  { label: "NFL", key: "americanfootball_nfl" },
  { label: "MLB", key: "baseball_mlb" },
];

export default function MakeBets() {
  const [bets, setBets] = useState([]);
  const [wagerAmount, setWagerAmount] = useState(100);
  const { user } = useAuth();

  const handleClearBets = () => setBets([]);
  const handleRemoveBet = (index) => setBets(prev => prev.filter((_, i) => i !== index));

  const handleSubmitSlip = async () => {
    if (!user || bets.length === 0 || wagerAmount <= 0) return;
    const slip = {
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
      wagerAmount,
      bets,
      status: "pending",
    };
    try {
      await addDoc(collection(db, "bets"), slip);
      setBets([]);
      setWagerAmount(100);
    } catch (error) {
      console.error("Error submitting bet slip:", error);
    }
  };

  return (
    <div className="p-4 text-white">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-80 order-1 lg:order-2">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Amount to Bet ($)</label>
            <input
              type="number"
              min="1"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(Number(e.target.value))}
              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>
          <BettingSlip
            bets={bets}
            wagerAmount={wagerAmount}
            onClearBets={handleClearBets}
            onRemoveBet={handleRemoveBet}
            onSubmitSlip={handleSubmitSlip}
          />
        </div>
        <div className="w-full lg:flex-1 order-2 lg:order-1">
          <OddsBoard
            sports={SPORTS}
            onAddBet={(bet) => setBets(prev => [...prev, bet])}
          />
        </div>
      </div>
    </div>
  );
}
