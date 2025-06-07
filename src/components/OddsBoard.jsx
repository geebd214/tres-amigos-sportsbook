// File: components/OddsBoard.jsx

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { fetchAllOdds } from "../utils/oddsApi";

const ODDS_CACHE_KEY = "cachedOdds";
const ODDS_CACHE_TIME_KEY = "cachedOddsTimestamp";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default function OddsBoard({ sports, onAddBet }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [oddsData, setOddsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const fetchOdds = async () => {
      const now = Date.now();
      const cachedTimestamp = localStorage.getItem(ODDS_CACHE_TIME_KEY);
      const cachedOdds = localStorage.getItem(ODDS_CACHE_KEY);

      if (cachedTimestamp && cachedOdds && now - cachedTimestamp < CACHE_TTL) {
        console.log("Odds fetched from cache");
        setOddsData(JSON.parse(cachedOdds));
        setLastUpdated(new Date(Number(cachedTimestamp)));
        return;
      }

      try {
        setLoadingCount((count) => count + 1);
        const data = await fetchAllOdds();
        localStorage.setItem(ODDS_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(ODDS_CACHE_TIME_KEY, now);
        setOddsData(data);
        setLastUpdated(new Date(now));
        console.log(`API hit count: ${loadingCount + 1}`);
      } catch (err) {
        console.error("Error fetching odds:", err);
      }
    };

    fetchOdds();
  }, [selectedDate, loadingCount]);

  const handlePrevious = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!oddsData) {
    return <p className="text-gray-400">Loading odds...</p>;
  }

  const selectedDateStr = selectedDate.toDateString();
  const filteredData = oddsData.filter(game => {
    const gameDateStr = new Date(game.commence_time).toDateString();
    return gameDateStr === selectedDateStr;
  });

  const hasGamesForDate = sports.some(({ key }) =>
    filteredData.some(game => game.sport_key === key)
  );

  return (
    <div className="w-full space-y-6">
      <div className="mb-4 flex items-center justify-center gap-4">
        <button onClick={handlePrevious} className="p-2 bg-gray-700 rounded-full">
          <FaChevronLeft />
        </button>
        <div className="text-lg font-semibold">
          {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
        <button onClick={handleNext} className="p-2 bg-gray-700 rounded-full">
          <FaChevronRight />
        </button>
      </div>

      {!hasGamesForDate ? (
        <div className="text-center text-gray-400">No games available for this date.</div>
      ) : (
        sports.map(({ label, key }) => {
          const games = filteredData.filter(game => game.sport_key === key);
          if (games.length === 0) return null;

          const isCollapsed = collapsed[key];

          return (
            <div key={key} className="bg-gray-800 p-4 rounded shadow w-full">
              <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => toggleCollapse(key)}>
                <h3 className="text-xl font-bold">{label}</h3>
                <div className="flex items-center gap-2">
                  {lastUpdated && (
                    <span className="text-xs text-gray-400">
                      Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="text-xl">{isCollapsed ? "▼" : "▲"}</span>
                </div>
              </div>
              {!isCollapsed && (
                <ul className="space-y-2">
                  {games.map(game => (
                    <li key={game.id} className="border border-gray-700 rounded p-3">
                      <p className="text-sm text-gray-400 mb-1">
                        {new Date(game.commence_time).toLocaleString()}
                      </p>
                      <p className="font-semibold mb-2">
                        {game.home_team} vs {game.away_team}
                      </p>
                      {game.bookmakers?.[0]?.markets?.map((market, mi) => (
                        <div key={mi} className="mb-2">
                          <p className="text-sm font-medium text-blue-300 capitalize">
                            {market.key.replace("h2h", "moneyline")}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {market.outcomes.map((outcome, oi) => (
                              <button
                                key={oi}
                                onClick={() =>
                                  onAddBet({
                                    game: `${game.home_team} vs ${game.away_team}`,
                                    market: market.key,
                                    team: outcome.name,
                                    odds: outcome.price,
                                    point: outcome.point ?? null,
                                    commence_time: game.commence_time,
                                    spread: market.key === "spreads" ? outcome.point : null,
                                    total: market.key === "totals" ? outcome.point : null,
                                  })
                                }
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                              >
                                {outcome.name}
                                {outcome.point !== undefined ? ` (${outcome.point})` : ""} {`(${outcome.price})`}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
