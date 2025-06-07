// File: pages/Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard({ user }) {
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

  const chartData = useMemo(() => {
    const timeRanges = { "1d": 1, "1w": 7, "1m": 30, "1y": 365, "all": Infinity };
    const timeFilter = "all";

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
  }, [myBets]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📈 Total Winnings Chart</h2>
      <div className="w-full h-64 bg-gray-800 rounded p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 50, bottom: 50 }}>
            <XAxis
              dataKey="name"
              stroke="#ccc"
              angle={-45}
              textAnchor="end"
              tickFormatter={(val) => val.slice(0, 5)}
              label={{ value: "Date", position: "insideBottomRight", offset: -20 }}
            />
            <YAxis
              stroke="#ccc"
              label={{ value: 'Winnings ($)', angle: -90, position: 'insideLeft', offset: -10 }}
              tickFormatter={(val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            />
            <Tooltip />
            <Line
              type="linear"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={true}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
