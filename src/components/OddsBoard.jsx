// src/components/OddsBoard.jsx
import { useEffect, useState } from "react";
import { ODDS_API_KEY } from "../config/oddsApi";

const API_KEY = ODDS_API_KEY;

export default function OddsBoard({ sports, selectedDate, onAddBet }) {
  const [oddsData, setOddsData] = useState({});

  useEffect(() => {
    fetchAllOdds();
  }, [selectedDate]);

  const fetchAllOdds = async () => {
    const allOdds = {};
    for (const sport of sports) {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        allOdds[sport.label] = data.filter((game) => {
          const gameDate = new Date(game.commence_time);
          return gameDate.toDateString() === selectedDate.toDateString();
        });
      } else {
        allOdds[sport.label] = [];
      }
    }
    setOddsData(allOdds);
  };

  return (
    <>
      {sports.map((sport) => (
        <div key={sport.key} className="mb-6">
          <h2 className="text-xl font-bold mb-2 text-white">🏈 {sport.label} Games</h2>
          {oddsData[sport.label]?.length > 0 ? (
            oddsData[sport.label].map((game) => (
              <div
                key={game.id}
                className="p-4 mb-2 border border-gray-700 rounded bg-gray-800 text-white shadow-sm"
              >
                <p className="font-semibold text-white">
                  {game.away_team} @ {game.home_team}
                </p>
                {game.bookmakers?.[0]?.markets.map((market) => (
                  <div key={market.key} className="text-sm mt-1 text-gray-300">
                    <strong className="uppercase text-gray-400">{market.key}</strong>:{" "}
                    {market.outcomes.map((o, i) => {
                      const extra = o.point !== undefined ? ` ${o.point}` : "";
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            onAddBet({
                              game: `${game.away_team} @ ${game.home_team}`,
                              market: market.key,
                              team: o.name,
                              odds: o.price,
                            })
                          }
                          className="inline-block bg-gray-700 hover:bg-blue-600 text-white rounded px-2 py-1 text-xs mr-2 mt-1"
                        >
                          {o.name}{extra} ({o.price})
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No games found for this day.</p>
          )}
        </div>
      ))}
    </>
  );
}
