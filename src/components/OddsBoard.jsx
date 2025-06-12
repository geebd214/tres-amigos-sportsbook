// File: components/OddsBoard.jsx

import React, { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useCachedOdds } from "../hooks/useAppLogic";
import { useNavigate } from "react-router-dom";
import { debug } from "../utils/debug.js";

export default function OddsBoard({ sports, onAddBet, user }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collapsed, setCollapsed] = useState({});
  const [selectedBookmaker, setSelectedBookmaker] = useState("Bovada");
  const { oddsData, oddsLastUpdated, error } = useCachedOdds(selectedDate);
  const navigate = useNavigate();

  // Get unique bookmakers from the odds data
  const bookmakers = useMemo(() => {
    if (!oddsData) return [];
    const uniqueBookmakers = new Set();
    oddsData.forEach((game) => {
      game.bookmakers?.forEach((bm) => uniqueBookmakers.add(bm.title));
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
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onClick = async (game, market, team, odds, point) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const marketTypeMap = {
      h2h: "moneyline",
      spreads: "spreads",
      totals: "totals",
    };

    const bet = {
      gameId: game.id,
      game: `${game.away_team} vs ${game.home_team}`,
      market,
      marketType: marketTypeMap[market],
      team,
      odds,
      point: point ?? null, // ✅ Default to null
      sportKey: game.sport_key,
      commence_time: game.commence_time,
    };

    onAddBet(bet);
  };

  if (!oddsData) {
    return <p className="text-gray-400">Loading odds...</p>;
  }

  const selectedDateStr = selectedDate.toDateString();
  const filteredData = oddsData.filter((game) => {
    const gameDateStr = new Date(game.commence_time).toDateString();
    return gameDateStr === selectedDateStr;
  });

  const hasGamesForDate = sports.some(({ key }) =>
    filteredData.some((game) => game.sport_key === key),
  );

  return (
    <div className="w-full space-y-6">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        {/* Date Selector - always centered */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-white"
            >
              <FaChevronLeft />
            </button>
            <div className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button
              onClick={handleNext}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-white"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Bookmaker Dropdown - on new row on mobile, right on desktop */}
        <div className="flex justify-center sm:justify-end">
          <select
            value={selectedBookmaker}
            onChange={(e) => setSelectedBookmaker(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white hover:bg-gray-700"
          >
            {bookmakers.map((bm) => (
              <option key={bm} value={bm}>
                {bm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-900/50 border-2 border-yellow-500 text-yellow-200 px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {!hasGamesForDate ? (
        <div className="text-center text-gray-400 py-8">
          No games available for this date.
        </div>
      ) : (
        sports.map(({ label, key }) => {
          const games = filteredData.filter((game) => game.sport_key === key);
          if (games.length === 0) return null;

          return (
            <div
              key={key}
              className="bg-gray-900 p-2 rounded-lg border border-gray-800 shadow-lg"
            >
              <button
                onClick={() => toggleCollapse(key)}
                className="w-full flex items-center justify-between mb-2 px-2 py-1 bg-gray-900 hover:bg-gray-800 rounded text-left"
              >
                <span className="text-xl font-bold text-white">{label}</span>
                <span className="text-xs text-gray-400">
                  {oddsLastUpdated
                    ? `Last updated: ${new Date(
                        oddsLastUpdated,
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}`
                    : ""}
                </span>
              </button>
              {/* Collapsible content */}
              {!collapsed[key] && (
                <div className="divide-y divide-gray-800">
                  {games.map((game) => {
                    // Find the selected bookmaker for this game
                    const bookmaker = game.bookmakers?.find(
                      (bm) =>
                        selectedBookmaker === "all" ||
                        bm.title === selectedBookmaker,
                    );
                    if (!bookmaker) return null;
                    // Find markets
                    const spreadMarket = bookmaker.markets.find(
                      (m) => m.key === "spreads",
                    );
                    const moneylineMarket = bookmaker.markets.find(
                      (m) => m.key === "h2h",
                    );
                    const totalMarket = bookmaker.markets.find(
                      (m) => m.key === "totals",
                    );
                    // Helper to get odds for a team
                    const getOutcome = (market, team) =>
                      market?.outcomes.find((o) => o.name === team);
                    // For totals, outcomes are usually Over/Under
                    const getTotalOutcome = (market, over) =>
                      market?.outcomes.find((o) =>
                        over
                          ? o.name.startsWith("Over")
                          : o.name.startsWith("Under"),
                      );
                    // Format odds
                    const formatOdds = (outcome, showPoint = true) => {
                      if (!outcome) return "-";
                      let price = outcome.price;
                      let point =
                        outcome.point !== undefined && showPoint
                          ? outcome.point
                          : null;
                      let priceStr =
                        price === 0 ? "EVEN" : price > 0 ? `+${price}` : price;
                      return `${point !== null ? (point > 0 ? `+${point}` : point) : ""}${point !== null ? " " : ""}(${priceStr})`;
                    };
                    // Format totals
                    const formatTotalOdds = (outcome, over) => {
                      if (!outcome) return "-";
                      let price = outcome.price;
                      let point = outcome.point;
                      let priceStr =
                        price === 0 ? "EVEN" : price > 0 ? `+${price}` : price;
                      return `${over ? "O" : "U"} ${point} (${priceStr})`;
                    };
                    return (
                      <div
                        key={game.id}
                        className="rounded-lg border border-gray-700 shadow bg-gray-800 hover:bg-gray-700 transition mb-2 overflow-hidden"
                      >
                        {/* Game row */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[100px_2fr_1fr_1fr_1fr] bg-gray-800 hover:bg-gray-700 transition rounded-lg border border-gray-700 shadow mb-2 overflow-hidden">
                          {/* Date/Time */}
                          <div className="p-2 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-700 bg-gray-900 text-white text-center">
                            <div className="text-lg">
                              {new Date(game.commence_time).toLocaleDateString(
                                "en-US",
                                {
                                  month: "numeric",
                                  day: "numeric",
                                  year: "2-digit",
                                },
                              )}
                            </div>
                            <div className="text-base">
                              {new Date(game.commence_time).toLocaleTimeString(
                                [],
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>

                          {/* Teams */}
                          <div className="p-2 flex items-center border-b sm:border-b-0 sm:border-r border-gray-700 text-white">
                            <div className="flex flex-col gap-0 leading-tight overflow-hidden text-ellipsis">
                              <span className="text-white font-medium truncate whitespace-nowrap">
                                {game.away_team}
                              </span>
                              <span className="border-t border-gray-700 my-1" />
                              <span className="text-white font-medium truncate whitespace-nowrap">
                                {game.home_team}
                              </span>
                            </div>
                          </div>

                          {/* Spread */}
                          <div className="p-2 border-b sm:border-b-0 sm:border-r border-gray-700 text-white flex flex-col items-stretch">
                            <div className="text-xs font-semibold uppercase text-gray-400 mb-1 text-center">
                              Spread
                            </div>

                            <button
                              className="
      w-full text-center px-3 py-2 
      text-base font-semibold 
      text-white 
      bg-gray-700 hover:bg-gray-600 
      rounded-lg border border-gray-600 
      shadow-sm hover:shadow-md 
      transition-colors duration-150
    "
                              onClick={() =>
                                onClick(
                                  game,
                                  "spreads",
                                  game.away_team,
                                  getOutcome(spreadMarket, game.away_team)
                                    ?.price,
                                  getOutcome(spreadMarket, game.away_team)
                                    ?.point,
                                )
                              }
                              disabled={!spreadMarket}
                            >
                              {formatOdds(
                                getOutcome(spreadMarket, game.away_team),
                              )}
                            </button>

                            <button
                              className="
      w-full text-center px-3 py-2 
      text-base font-semibold 
      text-white 
      bg-gray-700 hover:bg-gray-600 
      rounded-lg border border-gray-600 
      shadow-sm hover:shadow-md 
      transition-colors duration-150
    "
                              onClick={() =>
                                onClick(
                                  game,
                                  "spreads",
                                  game.home_team,
                                  getOutcome(spreadMarket, game.home_team)
                                    ?.price,
                                  getOutcome(spreadMarket, game.home_team)
                                    ?.point,
                                )
                              }
                              disabled={!spreadMarket}
                            >
                              {formatOdds(
                                getOutcome(spreadMarket, game.home_team),
                              )}
                            </button>
                          </div>

                          {/* Moneyline */}
                          <div className="p-2 border-b sm:border-b-0 sm:border-r border-gray-700 text-white flex flex-col items-stretch">
                            <div className="text-xs font-semibold uppercase text-gray-400 mb-1 text-center">
                              Moneyline
                            </div>
                            <button
                              className="
          w-full text-center px-3 py-2 
          text-base font-semibold 
          text-white 
          bg-gray-700 hover:bg-gray-600 
          rounded-lg border border-gray-600 
          shadow-sm hover:shadow-md 
          transition-colors duration-150
        "
                              onClick={() =>
                                onClick(
                                  game,
                                  "h2h",
                                  game.away_team,
                                  getOutcome(moneylineMarket, game.away_team)
                                    ?.price,
                                )
                              }
                              disabled={!moneylineMarket}
                            >
                              {formatOdds(
                                getOutcome(moneylineMarket, game.away_team),
                                false,
                              )}
                            </button>
                            <button
                              className="
          w-full text-center px-3 py-2 
          text-base font-semibold 
          text-white 
          bg-gray-700 hover:bg-gray-600 
          rounded-lg border border-gray-600 
          shadow-sm hover:shadow-md 
          transition-colors duration-150
        "
                              onClick={() =>
                                onClick(
                                  game,
                                  "h2h",
                                  game.home_team,
                                  getOutcome(moneylineMarket, game.home_team)
                                    ?.price,
                                )
                              }
                              disabled={!moneylineMarket}
                            >
                              {formatOdds(
                                getOutcome(moneylineMarket, game.home_team),
                                false,
                              )}
                            </button>
                          </div>

                          {/* Total */}
                          <div className="p-2 border-b sm:border-b-0 sm:border-r border-gray-700 text-white flex flex-col items-stretch">
                            <div className="text-xs font-semibold uppercase text-gray-400 mb-1 text-center">
                              Total
                            </div>
                            <button
                              className="
          w-full text-center px-3 py-2 
          text-base font-semibold 
          text-white 
          bg-gray-700 hover:bg-gray-600 
          rounded-lg border border-gray-600 
          shadow-sm hover:shadow-md 
          transition-colors duration-150
        "
                              onClick={() =>
                                onClick(
                                  game,
                                  "totals",
                                  "Over",
                                  getTotalOutcome(totalMarket, true)?.price,
                                  getTotalOutcome(totalMarket, true)?.point,
                                )
                              }
                              disabled={!totalMarket}
                            >
                              {formatTotalOdds(
                                getTotalOutcome(totalMarket, true),
                                true,
                              )}
                            </button>
                            <button
                              className="
          w-full text-center px-3 py-2 
          text-base font-semibold 
          text-white 
          bg-gray-700 hover:bg-gray-600 
          rounded-lg border border-gray-600 
          shadow-sm hover:shadow-md 
          transition-colors duration-150
        "
                              onClick={() =>
                                onClick(
                                  game,
                                  "totals",
                                  "Under",
                                  getTotalOutcome(totalMarket, false)?.price,
                                  getTotalOutcome(totalMarket, false)?.point,
                                )
                              }
                              disabled={!totalMarket}
                            >
                              {formatTotalOdds(
                                getTotalOutcome(totalMarket, false),
                                false,
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
