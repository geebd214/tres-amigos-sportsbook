import { Trash2 } from "lucide-react";

export default function BettingSlip({
  bets,
  wagerAmount,
  onClearBets,
  onRemoveBet,
  onSubmitSlip,
}) {
  // Calculate parlay odds by multiplying decimal odds
  const calculateParlayOdds = (bets) => {
    return bets.reduce((acc, bet) => acc * bet.odds, 1);
  };

  const parlayOdds = bets.length > 0 ? calculateParlayOdds(bets) : null;
  const potentialWinnings = parlayOdds
    ? (wagerAmount * (parlayOdds - 1)).toFixed(2)
    : null; // Subtract 1 to get profit only

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🎟️ Betting Slip</h2>
        {bets.length > 0 && (
          <button
            onClick={onClearBets}
            className="text-sm text-red-400 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>
      {bets.length === 0 ? (
        <p className="text-gray-400">No bets added yet.</p>
      ) : (
        <>
          <ul className="mb-4 space-y-2">
            {bets.map((bet, i) => (
              <li
                key={i}
                className="bg-gray-700 p-2 rounded text-sm flex justify-between items-start gap-2"
              >
                <div>
                  <div className="font-semibold">{bet.game}</div>
                  <div>
                    {bet.market.toUpperCase()} — {bet.team} (
                    {bet.odds.toFixed(2)}x)
                  </div>
                  {bet.spread !== null && <div>Spread: {bet.spread}</div>}
                  {bet.total !== null && <div>O/U Line: {bet.total}</div>}
                </div>
                <button
                  onClick={() => onRemoveBet(i)}
                  className="text-red-400 hover:text-red-500"
                  aria-label="Remove bet"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-green-400 font-semibold">
            Parlay Odds: {parlayOdds.toFixed(2)}x
          </div>
          <div className="mt-1 text-yellow-300 font-semibold">
            Potential Win: ${potentialWinnings}
          </div>
          <button
            onClick={onSubmitSlip}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
          >
            Submit Bet Slip
          </button>
        </>
      )}
    </div>
  );
}
