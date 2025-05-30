// File: App.jsx

import { useEffect, useState } from "react";
import { auth, signInWithGoogle, logout, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import CalendarSidebar from "./components/CalendarSidebar";
import OddsBoard from "./components/OddsBoard";
import { fetchAllOdds } from "./utils/oddsApi";
import BettingSlip from "./components/BettingSlip";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SPORTS = [
  { label: "NBA", key: "basketball_nba" },
  { label: "NFL", key: "americanfootball_nfl" },
  { label: "MLB", key: "baseball_mlb" },
];

const ODDS_CACHE_KEY = "cachedOdds";
const ODDS_CACHE_TIME_KEY = "cachedOddsTimestamp";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bets, setBets] = useState([]);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [myBets, setMyBets] = useState([]);
  const [activeTab, setActiveTab] = useState("makeBets");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showCalendar, setShowCalendar] = useState(true);
  const [oddsData, setOddsData] = useState(null);
  const [oddsLastUpdated, setOddsLastUpdated] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "bets"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyBets(bets);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const fetchOdds = async () => {
      const now = Date.now();
      const cachedTimestamp = localStorage.getItem(ODDS_CACHE_TIME_KEY);
      const cachedOdds = localStorage.getItem(ODDS_CACHE_KEY);

      if (cachedTimestamp && cachedOdds && now - cachedTimestamp < CACHE_TTL) {
        setOddsData(JSON.parse(cachedOdds));
        setOddsLastUpdated(new Date(Number(cachedTimestamp)));
        return;
      }

      try {
        const data = await fetchAllOdds();
        localStorage.setItem(ODDS_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(ODDS_CACHE_TIME_KEY, now);
        setOddsData(data);
        setOddsLastUpdated(new Date(now));
      } catch (err) {
        console.error("Error fetching odds:", err);
      }
    };

    fetchOdds();
  }, [selectedDate]);

  const handleAddBet = (bet) => setBets((prev) => [...prev, bet]);
  const handleRemoveBet = (index) => setBets((prev) => prev.filter((_, i) => i !== index));
  const handleClearBets = () => setBets([]);

  const handleSubmitSlip = async () => {
    if (!user || bets.length === 0 || wagerAmount <= 0) return;
    const slip = {
      userId: user.uid,
      userName: user.displayName,
      createdAt: serverTimestamp(),
      wagerAmount,
      bets,
      status: "pending"
    };
    try {
      await addDoc(collection(db, "bets"), slip);
      setBets([]);
      setWagerAmount(100);
    } catch (error) {
      console.error("Error submitting bet slip:", error);
    }
  };

  const filteredBets = (statusFilter === "all" ? myBets : myBets.filter(bet => bet.status === statusFilter))
    .sort((a, b) => {
      const aEarliest = Math.min(...a.bets.map(bet => new Date(bet.commence_time).getTime() || 0));
      const bEarliest = Math.min(...b.bets.map(bet => new Date(bet.commence_time).getTime() || 0));
      return aEarliest - bEarliest;
    });

  const timeRanges = { "1d": 1, "1w": 7, "1m": 30, "1y": 365, "all": Infinity };

  const chartData = myBets
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
      const change = bet.status === "win" ? bet.wagerAmount : -bet.wagerAmount;
      const last = acc.length > 0 ? acc[acc.length - 1].total : 0;
      acc.push({ name: date, total: last + change });
      return acc;
    }, []);

  if (chartData.length === 0) {
    const today = new Date();
    chartData.push(...Array.from({ length: 10 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (9 - i));
      return {
        name: date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }),
        total: i * 50 - (i % 3 === 0 ? 100 : 0)
      };
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 shadow bg-gray-800">
        <h1 className="text-2xl font-bold">Tres Amigos Sportsbook</h1>
        <div>
          {!user ? (
            <button onClick={signInWithGoogle} className="px-4 py-2 bg-green-600 text-white rounded">
              Sign in with Google
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="font-medium">Welcome, {user.displayName}</span>
              <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="flex justify-start overflow-x-auto border-b border-gray-700 bg-gray-800">
        {[{ key: "makeBets", label: "Make Bets" }, { key: "myBets", label: "My Bets" }].map(tab => (
          <button
            key={tab.key}
            className={`px-6 py-3 whitespace-nowrap ${activeTab === tab.key ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="md:w-64 w-full p-4 border-b md:border-b-0 md:border-r border-gray-700 bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">📅 Pick a Date</h2>
            <button
              onClick={() => setShowCalendar(prev => !prev)}
              className="text-sm text-blue-400 underline"
            >
              {showCalendar ? "Hide" : "Show"}
            </button>
          </div>
          {showCalendar && <CalendarSidebar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
        </aside>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {user ? (
            activeTab === "makeBets" ? (
              <div className="flex gap-6">
                <div className="flex-1">
                {oddsLastUpdated && (
    <div className="text-xs text-gray-400 text-right mt-2">
      Odds last updated: {oddsLastUpdated.toLocaleString()}
    </div>
  )}
                  <OddsBoard sports={SPORTS} selectedDate={selectedDate} onAddBet={handleAddBet} />
                </div>
                
                <div className="w-80">
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
              <div>
                <h2 className="text-xl font-bold mb-4">📈 Total Winnings</h2>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    {["1d", "1w", "1m", "1y", "all"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeFilter(t)}
                        className={`mr-2 px-3 py-1 rounded ${timeFilter === t ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full h-64 mb-8 bg-gray-800 rounded p-2">
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
                      <Line type="linear" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={true} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

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
  const decimal = o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1;
  return acc * decimal;
}, 1);
                    const potential = slip.wagerAmount * parlayOdds;
                    return (
                      <li key={slip.id} className="relative border border-gray-700 bg-gray-800 p-4 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm text-gray-400">Placed: {slip.createdAt?.toDate().toLocaleString()}</p>
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full
                              ${slip.status === "win" ? "bg-green-600 text-white" :
                                slip.status === "lose" ? "bg-red-600 text-white" :
                                "bg-yellow-500 text-black"}`}
                          >
                            {slip.status === "lose" ? "LOSS" : slip.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold text-white">Wager: {slip.wagerAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        <p className="text-sm text-gray-300">Parlay Odds: {parlayOdds.toFixed(2)}</p>
                        <p className="text-sm text-gray-300">Potential Winnings: {potential.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        <ul className="mt-2 text-sm text-white list-disc ml-4">
                          {slip.bets.map((b, i) => (
                            <li key={i}>{b.game} — {b.market.toUpperCase()} — {b.team} ({b.odds})</li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          ) : (
            <p className="text-gray-300 text-lg">Please sign in to view games and odds.</p>
          )}
        </main>
      </div>
    </div>
  );
}
