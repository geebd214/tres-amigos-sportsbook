// File: components/OddsBoard.jsx

import React, { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useCachedOdds } from "../hooks/useAppLogic";
import { useNavigate } from "react-router-dom";
import { debug } from "../utils/debug.js";

export default function OddsBoard({ sports, onAddBet }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState({});
  const [selectedBookmaker, setSelectedBookmaker] = useState("Bovada");
  const { oddsData, oddsLastUpdated, error } = useCachedOdds(selectedDate);
  const navigate = useNavigate();

  // Get unique bookmakers from the odds data
  const bookmakers = useMemo(() => {
    if (!oddsData) return [];
    const uniqueBookmakers = new Set();
    oddsData.forEach(game => {
      game.bookmakers?.forEach(bm => uniqueBookmakers.add(bm.title));
    });
    return Array.from(uniqueBookmakers).sort();
  }, [oddsData]);

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

  const onClick = async (game, market, team, odds, point) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const bet = {
      game,
      market,
      team,
      odds,
      point,
      sportKey: game.sport_key,
      gameTime: game.commence_time
    };

    navigate('/make-bets', { state: { bet } });
  };

  const handleOddsClick = (game, market, selection) => {
    debug.info('Odds clicked:', { game, market, selection });
    
    const newBet = {
      id: Date.now(),
      game: {
        id: game.id,
        sport: game.sport_key,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        startTime: game.commence_time
      },
      market,
      selection,
      odds: selection.price,
      timestamp: new Date().toISOString()
    };
    
    debug.info('Created new bet:', newBet);
    
    setSelectedBets(prev => {
      const updated = [...prev, newBet];
      debug.info('Updated selected bets:', updated);
      return updated;
    });
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevious} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
            <FaChevronLeft />
          </button>
          <div className="text-lg font-semibold">
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <button onClick={handleNext} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
            <FaChevronRight />
          </button>
        </div>
        <select
          value={selectedBookmaker}
          onChange={(e) => setSelectedBookmaker(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white hover:bg-gray-600"
        >
          <option value="all">All Bookmakers</option>
          {bookmakers.map(bm => (
            <option key={bm} value={bm}>{bm}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-yellow-900/50 border-2 border-yellow-500 text-yellow-200 px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {!hasGamesForDate ? (
        <div className="text-center text-gray-400 py-8">No games available for this date.</div>
      ) : (
        sports.map(({ label, key }) => {
          const games = filteredData.filter(game => game.sport_key === key);
          if (games.length === 0) return null;

          const isCollapsed = collapsed[key];

          return (
            <div key={key} className="bg-gray-800 p-4 rounded-lg border-2 border-gray-700 shadow-lg">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-700/50 p-2 rounded-lg transition-colors" 
                onClick={() => toggleCollapse(key)}
              >
                <h3 className="text-xl font-bold">{label}</h3>
                <div className="flex items-center gap-2">
                  {oddsLastUpdated && (
                    <span className="text-xs text-gray-400">
                      Updated: {oddsLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="text-xl">{isCollapsed ? "▼" : "▲"}</span>
                </div>
              </div>
              {!isCollapsed && (
                <ul className="space-y-4">
                  {games.map((game) => (
                    <li key={game.id} className="border-t border-gray-700 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-200">
                            {game.away_team} @ {game.home_team}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {game.bookmakers
                        ?.filter(bm => selectedBookmaker === "all" || bm.title === selectedBookmaker)
                        .map((bookmaker) => (
                          <div key={bookmaker.key} className="mt-2">
                            <h5 className="text-sm font-medium text-gray-400">{bookmaker.title}</h5>
                            {bookmaker.markets.map((market) => (
                              <div key={market.key} className="mt-1">
                                <h6 className="text-sm font-medium text-gray-500">{market.key.toUpperCase()}</h6>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {market.outcomes.map((outcome, oi) => (
                                    <button
                                      key={oi}
                                      onClick={() => {
                                        onClick(game, market.key, outcome.name, outcome.price, outcome.point ?? null);
                                      }}
                                      className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm border border-gray-600 transition-colors"
                                    >
                                      {outcome.name}
                                      {outcome.point !== undefined ? ` (${outcome.point})` : ""} {`(${outcome.price})`}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
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
