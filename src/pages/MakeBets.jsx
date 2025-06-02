// File: pages/MakeBets.jsx

import { useState } from "react";
import CalendarSidebar from "../components/CalendarSidebar";
import OddsBoard from "../components/OddsBoard";
import BettingSlip from "../components/BettingSlip";
import { useCachedOdds } from "../hooks/useAppLogic";
import { FaRegCalendarAlt }  from "react-icons/fa";

export default function MakeBets({ user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bets, setBets] = useState([]);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [showCalendar, setShowCalendar] = useState(true);

  const { oddsData, oddsLastUpdated } = useCachedOdds(selectedDate);

  const handleAddBet = (bet) => setBets((prev) => [...prev, bet]);
  const handleRemoveBet = (index) => setBets((prev) => prev.filter((_, i) => i !== index));
  const handleClearBets = () => setBets([]);

  const handleSubmitSlip = async () => {
    if (!user || bets.length === 0 || wagerAmount <= 0) return;
    const slip = {
      userId: user.uid,
      userName: user.displayName,
      createdAt: new Date(),
      wagerAmount,
      bets,
      status: "pending",
    };
    // Save slip to Firestore (optional: abstract to a hook)
    console.log("Submitting slip", slip);
    setBets([]);
    setWagerAmount(100);
  };

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="md:w-64 w-full p-4 border-b md:border-b-0 md:border-r border-gray-700 bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaRegCalendarAlt className="text-xl" />
            Pick a Date
          </h2>
          <button
            onClick={() => setShowCalendar((prev) => !prev)}
            className="text-sm text-blue-400 underline"
          >
            {showCalendar ? "Hide" : "Show"}
          </button>
        </div>
        {showCalendar && <CalendarSidebar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
      </aside>

      <main className="flex-1 p-4 sm:p-6">
        {user ? (
          <div className="flex gap-6 flex-col lg:flex-row">
            <div className="flex-1">
              {oddsLastUpdated && (
                <div className="text-xs text-gray-400 text-right mb-2">
                  Odds last updated: {oddsLastUpdated.toLocaleString()}
                </div>
              )}
              <OddsBoard
                sports={[
                  { label: "NBA", key: "basketball_nba" },
                  { label: "NFL", key: "americanfootball_nfl" },
                  { label: "MLB", key: "baseball_mlb" },
                ]}
                selectedDate={selectedDate}
                onAddBet={handleAddBet}
              />
            </div>

            <div className="w-full lg:w-80">
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
          </div>
        ) : (
          <p className="text-gray-300 text-lg">Please sign in to view games and odds.</p>
        )}
      </main>
    </div>
  );
}
