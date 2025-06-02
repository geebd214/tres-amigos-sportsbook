// File: pages/MyBets.jsx

import { useState } from "react";
import { useUserBets, useFilteredBets } from "../hooks/useAppLogic";

export default function MyBets({ user }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const { myBets } = useUserBets(user);
  const filteredBets = useFilteredBets(myBets, statusFilter);

  return (
    <div className="p-6 text-white">

      <h2 className="text-xl font-bold mb-4">🧾 My Bets</h2>
      <div className="mb-4">
        <label className="block mb-1 text-sm">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="win">Win</option>
          <option value="lose">Lose</option>
        </select>
      </div>

      <ul className="space-y-4">
        {filteredBets.map((slip) => {
          const parlayOdds = slip.bets.reduce((acc, b) => {
            const o = b.odds;
            const decimal = o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1;
            return acc * decimal;
          }, 1);
          const potential = slip.wagerAmount * parlayOdds;

          return (
            <li key={slip.id} className="relative border border-gray-700 bg-gray-800 p-4 rounded">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-gray-400">
                  Placed: {slip.createdAt?.toDate()?.toLocaleString?.()}
                </p>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full
                    ${slip.status === "win" ? "bg-green-600 text-white" :
                      slip.status === "lose" ? "bg-red-600 text-white" :
                      "bg-yellow-500 text-black"}`}
                >
                  {slip.status === "lose" ? "LOSS" : slip.status?.toUpperCase?.()}
                </span>
              </div>
              <p className="font-semibold text-white">
                Wager: {slip.wagerAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </p>
              <p className="text-sm text-gray-300">Parlay Odds: {parlayOdds.toFixed(2)}</p>
              <p className="text-sm text-gray-300">
                Potential Winnings: {potential.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </p>
              <ul className="mt-2 text-sm text-white list-disc ml-4">
                {slip.bets.map((b, i) => (
                  <li key={i}>
                    {b.game} — {b.market.toUpperCase()} — {b.team} ({b.odds})
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
