import {
  FaBasketballBall,
  FaFootballBall,
  FaBaseballBall,
} from "react-icons/fa";
import { debug } from "../utils/debug.js";

export default function BetCard({ bet }) {
  debug.info("Rendering BetCard with bet:", bet);

  // Calculate parlay odds by multiplying decimal odds
  const parlayOdds =
    bet.bets?.reduce((oAcc, b) => {
      return oAcc * b.odds;
    }, 1) ?? 1;

  const profitLoss =
    bet.status === "win"
      ? bet.wagerAmount * (parlayOdds - 1) // Subtract 1 to get profit only
      : -bet.wagerAmount;

  const potentialWinnings = bet.wagerAmount * (parlayOdds - 1); // Subtract 1 to get profit only

  // Get sport icon based on the first bet's sport
  const getSportIcon = (sportParam) => {
    const sport = sportParam ?? bet.bets[0]?.sport;
    debug.info("Getting sport icon for sport:", sport);

    if (!sport) {
      debug.warn("No sport found in bet");
      return null;
    }

    const sportKey = sport.toLowerCase();
    debug.info("Sport key:", sportKey);

    switch (sportKey) {
      case "baseball_mlb":
        return <FaBaseballBall />;
      case "basketball_nba":
        return <FaBasketballBall />;
      case "football_nfl":
        return <FaFootballBall />;
      default:
        debug.warn(`No icon found for sport: ${sportKey}`);
        return null;
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 shadow-lg ${
        bet.status === "win"
          ? "bg-gray-700 border-green-500 shadow-green-500/20"
          : bet.status === "lose"
            ? "bg-gray-700 border-red-500 shadow-red-500/20"
            : "bg-gray-700 border-yellow-500 shadow-yellow-500/20"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                  bet.status === "win"
                    ? "bg-green-900 text-green-200"
                    : bet.status === "lose"
                      ? "bg-red-900 text-red-200"
                      : "bg-yellow-900 text-yellow-200"
                }`}
              >
                {bet.status.toUpperCase()}
              </span>
            </div>
            <p
              className={`text-lg font-semibold ${
                profitLoss >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
            </p>
          </div>

          {/* Game + Bet Info in Two Columns */}
          <div className="mb-3 p-2 bg-gray-800/50 rounded-lg">
            {bet.bets
              ?.slice()
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
              .map((b, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start border-b border-gray-700 last:border-b-0 py-2"
                >
                  <div className="flex gap-2">
                    {/* Sport Icon */}
                    <div className="pt-1">{getSportIcon(b.sport)}</div>

                    {/* Bet Details */}
                    <div className="flex flex-col text-sm text-gray-200">
                      <span className="text-xs text-gray-400">
                        {b.startTime
                          ? new Date(b.startTime).toLocaleString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "Start time unknown"}
                      </span>
                      <span className="font-medium">{b.game}</span>

                      <span className="text-sm text-gray-300 mt-1">
                        ➤ {b.team}{" "}
                        {b.market === "spreads" && b.point !== null
                          ? `(${b.point}) `
                          : ""}
                        <span className="uppercase">{b.market}</span>
                      </span>
                    </div>
                  </div>

                  {/* Odds */}
                  <div className="text-sm font-semibold text-right text-gray-200 min-w-[60px]">
                    {b.odds.toFixed(2)}x
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-600">
        <p className="text-xs text-gray-400 mb-2">
          Bet placed:{" "}
          {bet.createdAt?.toDate
            ? bet.createdAt.toDate().toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "—"}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-300">
            Wager: ${bet.wagerAmount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-300">
            Odds: {parlayOdds.toFixed(2)}x
          </p>
        </div>
        {bet.status === "pending" && (
          <p className="mt-1 text-sm text-green-400">
            Potential Win: ${potentialWinnings.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
