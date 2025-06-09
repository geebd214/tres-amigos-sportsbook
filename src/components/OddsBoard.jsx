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
          <button onClick={handlePrevious} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-white">
            <FaChevronLeft />
          </button>
          <div className="text-lg font-semibold text-white">
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <button onClick={handleNext} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-white">
            <FaChevronRight />
          </button>
        </div>
        <select
          value={selectedBookmaker}
          onChange={(e) => setSelectedBookmaker(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white hover:bg-gray-700"
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

          return (
            <div key={key} className="bg-gray-900 p-2 rounded-lg border border-gray-800 shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-white pl-2">{label}</h3>
              <div className="divide-y divide-gray-800">
                {games.map((game) => {
                  // Find the selected bookmaker for this game
                  const bookmaker = game.bookmakers?.find(bm => selectedBookmaker === "all" || bm.title === selectedBookmaker);
                  if (!bookmaker) return null;
                  // Find markets
                  const spreadMarket = bookmaker.markets.find(m => m.key === "spreads");
                  const moneylineMarket = bookmaker.markets.find(m => m.key === "h2h");
                  const totalMarket = bookmaker.markets.find(m => m.key === "totals");
                  // Helper to get odds for a team
                  const getOutcome = (market, team) => market?.outcomes.find(o => o.name === team);
                  // For totals, outcomes are usually Over/Under
                  const getTotalOutcome = (market, over) => market?.outcomes.find(o => over ? o.name.startsWith("Over") : o.name.startsWith("Under"));
                  // Format odds
                  const formatOdds = (outcome, showPoint = true) => {
                    if (!outcome) return "-";
                    let price = outcome.price;
                    let point = outcome.point !== undefined && showPoint ? outcome.point : null;
                    let priceStr = price === 0 ? "EVEN" : (price > 0 ? `+${price}` : price);
                    return `${point !== null ? (point > 0 ? `+${point}` : point) : ""}${point !== null ? " " : ""}(${priceStr})`;
                  };
                  // Format totals
                  const formatTotalOdds = (outcome, over) => {
                    if (!outcome) return "-";
                    let price = outcome.price;
                    let point = outcome.point;
                    let priceStr = price === 0 ? "EVEN" : (price > 0 ? `+${price}` : price);
                    return `${over ? "O" : "U"} ${point} (${priceStr})`;
                  };
                  return (
                    <div key={game.id} className="grid grid-cols-5 items-stretch bg-gray-800 hover:bg-gray-700 transition rounded-lg mb-2 border border-gray-700 shadow">
                      {/* Date/Time Block */}
                      <div className="flex flex-col items-center justify-center bg-gray-900 text-white font-bold py-2 px-4 rounded-l-lg min-w-[90px] border-r border-gray-700">
                        <span className="text-lg">{new Date(game.commence_time).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })}</span>
                        <span className="text-base">{new Date(game.commence_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      {/* Teams */}
                      <div className="flex flex-col justify-center border-l-0 border-r border-gray-700 px-4 py-2 col-span-2 min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-white font-medium">{game.away_team}</span>
                          <span className="border-t border-gray-700 my-1" />
                          <span className="text-white font-medium">{game.home_team}</span>
                        </div>
                      </div>
                      {/* Odds Columns */}
                      {/* Spread */}
                      <div className="flex flex-col border-l-0 border-r border-gray-700 px-2 py-2 items-center justify-center">
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700 mb-1"
                          onClick={() => onClick(game, "spreads", game.away_team, getOutcome(spreadMarket, game.away_team)?.price, getOutcome(spreadMarket, game.away_team)?.point)}
                          disabled={!spreadMarket}
                        >
                          {formatOdds(getOutcome(spreadMarket, game.away_team))}
                        </button>
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700"
                          onClick={() => onClick(game, "spreads", game.home_team, getOutcome(spreadMarket, game.home_team)?.price, getOutcome(spreadMarket, game.home_team)?.point)}
                          disabled={!spreadMarket}
                        >
                          {formatOdds(getOutcome(spreadMarket, game.home_team))}
                        </button>
                      </div>
                      {/* Moneyline */}
                      <div className="flex flex-col border-l-0 border-r border-gray-700 px-2 py-2 items-center justify-center">
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700 mb-1"
                          onClick={() => onClick(game, "h2h", game.away_team, getOutcome(moneylineMarket, game.away_team)?.price)}
                          disabled={!moneylineMarket}
                        >
                          {formatOdds(getOutcome(moneylineMarket, game.away_team), false)}
                        </button>
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700"
                          onClick={() => onClick(game, "h2h", game.home_team, getOutcome(moneylineMarket, game.home_team)?.price)}
                          disabled={!moneylineMarket}
                        >
                          {formatOdds(getOutcome(moneylineMarket, game.home_team), false)}
                        </button>
                      </div>
                      {/* Total */}
                      <div className="flex flex-col border-l-0 px-2 py-2 items-center justify-center rounded-r-lg">
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700 mb-1"
                          onClick={() => onClick(game, "totals", "Over", getTotalOutcome(totalMarket, true)?.price, getTotalOutcome(totalMarket, true)?.point)}
                          disabled={!totalMarket}
                        >
                          {formatTotalOdds(getTotalOutcome(totalMarket, true), true)}
                        </button>
                        <button
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-600 text-gray-200 font-semibold border border-gray-700"
                          onClick={() => onClick(game, "totals", "Under", getTotalOutcome(totalMarket, false)?.price, getTotalOutcome(totalMarket, false)?.point)}
                          disabled={!totalMarket}
                        >
                          {formatTotalOdds(getTotalOutcome(totalMarket, false), false)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
