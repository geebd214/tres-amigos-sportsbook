// File: pages/Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from "recharts";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Helper to handle Firestore Timestamp or ISO string
function getCreatedAtDate(createdAt) {
  if (!createdAt) return null;
  if (typeof createdAt.toDate === 'function') return createdAt.toDate();
  if (typeof createdAt === 'string') return new Date(createdAt);
  return createdAt;
}

export default function Dashboard({ user }) {
  const [myBets, setMyBets] = useState([]);
  const [timeRange, setTimeRange] = useState("1d"); // "1d", "1w", "1m", "all"
  const [selectedDate, setSelectedDate] = useState(null);

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
    const timeRanges = { 
      "1d": 1, 
      "1w": 7, 
      "1m": 30, 
      "all": Infinity 
    };

    // First, filter bets by time range and status
    const filteredBets = myBets
      .filter(bet => bet.status === "win" || bet.status === "lose")
      .filter(bet => {
        if (timeRange === "all" || !bet.createdAt) return true;
        const days = timeRanges[timeRange];
        const createdAtDate = getCreatedAtDate(bet.createdAt);
        const diff = (new Date() - createdAtDate) / (1000 * 60 * 60 * 24);
        return diff <= days;
      });

    // Group bets by date with format based on time range
    const betsByDate = filteredBets.reduce((acc, bet) => {
      const createdAtDate = getCreatedAtDate(bet.createdAt);
      let date;
      
      if (timeRange === "1d") {
        // For daily view, group by hour
        date = createdAtDate.toLocaleString("en-US", {
          hour: "numeric",
          hour12: true
        });
      } else if (timeRange === "1w") {
        // For weekly view, group by day
        date = createdAtDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric"
        });
      } else {
        // For monthly and all view, group by date
        date = createdAtDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      }

      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(bet);
      return acc;
    }, {});

    // Calculate running total with proper date sorting
    let runningTotal = 0;
    const data = Object.entries(betsByDate)
      .sort(([dateA], [dateB]) => {
        if (timeRange === "1d") {
          // For daily view, sort by hour
          const hourA = parseInt(dateA.split(":")[0]);
          const hourB = parseInt(dateB.split(":")[0]);
          return hourA - hourB;
        }
        return new Date(dateA) - new Date(dateB);
      })
      .map(([date, bets]) => {
        // Calculate total change for all bets in this time period
        const periodChange = bets.reduce((total, bet) => {
          const parlayOdds = bet.bets?.reduce((oAcc, b) => {
            const dec = b.odds > 0 ? b.odds / 100 + 1 : 100 / Math.abs(b.odds) + 1;
            return oAcc * dec;
          }, 1) ?? 1;
          const change = bet.status === "win"
            ? bet.wagerAmount * parlayOdds
            : -bet.wagerAmount;
          return total + change;
        }, 0);

        runningTotal += periodChange;
        return {
          name: date,
          total: runningTotal,
          bets,
          dailyChange: periodChange
        };
      });

    // If no bets in the time range, add a zero point
    if (data.length === 0) {
      const now = new Date();
      let defaultDate;
      
      if (timeRange === "1d") {
        defaultDate = now.toLocaleString("en-US", {
          hour: "numeric",
          hour12: true
        });
      } else if (timeRange === "1w") {
        defaultDate = now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric"
        });
      } else {
        defaultDate = now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      }
      
      data.push({ name: defaultDate, total: 0, bets: [], dailyChange: 0 });
    }

    return data;
  }, [myBets, timeRange]);

  const selectedBets = useMemo(() => {
    if (!selectedDate) return [];
    const dataPoint = chartData.find(point => point.name === selectedDate);
    return dataPoint?.bets || [];
  }, [selectedDate, chartData]);

  return (
    <div className="p-6">
      <style>
        {`
          html {
            overflow-y: scroll;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #1F2937;
          }
          ::-webkit-scrollbar-thumb {
            background: #4B5563;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}
      </style>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          📈 Total Winnings: ${chartData.length > 0 ? chartData[chartData.length - 1].total.toFixed(2) : "0.00"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("1d")}
            className={`px-3 py-1 rounded ${timeRange === "1d" ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-700`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange("1w")}
            className={`px-3 py-1 rounded ${timeRange === "1w" ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-700`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange("1m")}
            className={`px-3 py-1 rounded ${timeRange === "1m" ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-700`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`px-3 py-1 rounded ${timeRange === "all" ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-700`}
          >
            All Time
          </button>
        </div>
      </div>
      <div className="w-full h-64 bg-gray-800 rounded p-2 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={800}
            height={400}
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ stroke: '#8884d8', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 p-3 border border-gray-700 rounded shadow-lg pointer-events-none">
                      <p className="font-semibold text-gray-200">
                        {new Date(data.name).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-gray-400">Total: ${data.total.toFixed(2)}</p>
                      <p className="text-gray-400">Daily Change: ${data.dailyChange.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{data.bets.length} bet{data.bets.length !== 1 ? 's' : ''}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
            {chartData.map((entry, index) => (
              <ReferenceDot
                key={`dot-${index}`}
                x={entry.name}
                y={entry.total}
                r={6}
                fill="#8884d8"
                stroke="#fff"
                strokeWidth={2}
                onClick={() => setSelectedDate(entry.name)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {selectedDate && (
        <div className="mt-4 bg-gray-800 rounded-lg shadow p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-200">
            Bets for {selectedDate}
          </h3>
          {selectedBets.length === 0 ? (
            <p className="text-gray-400">No bets found for this date</p>
          ) : (
            <div className="space-y-3 pr-2">
              {selectedBets.map((bet, index) => {
                const parlayOdds = bet.bets?.reduce((oAcc, b) => {
                  const dec = b.odds > 0 ? b.odds / 100 + 1 : 100 / Math.abs(b.odds) + 1;
                  return oAcc * dec;
                }, 1) ?? 1;
                const profitLoss = bet.status === "win"
                  ? bet.wagerAmount * parlayOdds
                  : -bet.wagerAmount;
                
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      bet.status === "win" 
                        ? "bg-gray-700 border-green-500" 
                        : "bg-gray-700 border-red-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          bet.status === "win" 
                            ? "bg-green-900 text-green-200" 
                            : "bg-red-900 text-red-200"
                        }`}>
                          {bet.status.toUpperCase()}
                        </span>
                        {bet.bets?.map((b, i) => (
                        <p key={i} className="text-sm text-gray-300">
                          {b.team} ({b.odds > 0 ? "+" : ""}{b.odds})
                        </p>
                      ))}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          profitLoss >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-600">
                                              <p className="mt-1 text-sm text-gray-300">
                          Wager: ${bet.wagerAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-300">
                          Odds: {parlayOdds.toFixed(2)}x
                        </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
