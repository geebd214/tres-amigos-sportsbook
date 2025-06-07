// File: components/OddsBoard.jsx

import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useCachedOdds } from "../hooks/useAppLogic";

export default function OddsBoard({ sports, onAddBet }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState({});
  const { oddsData, oddsLastUpdated } = useCachedOdds(selectedDate);

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
                          <h4 className="font-semibold">{game.home_team}</h4>
                          <h4 className="font-semibold">{game.away_team}</h4>
                          <p className="text-sm text-gray-400">
                            {new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {game.bookmakers?.map((bookmaker) => (
                        <div key={bookmaker.key} className="mt-2">
                          <h5 className="text-sm font-medium text-gray-400">{bookmaker.title}</h5>
                          {bookmaker.markets.map((market) => (
                            <div key={market.key} className="mt-1">
                              <h6 className="text-sm font-medium text-gray-500">{market.key.toUpperCase()}</h6>
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
