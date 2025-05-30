import { Trash2 } from "lucide-react";

export default function BettingSlip({ bets, wagerAmount, onClearBets, onRemoveBet, onSubmitSlip }) {
  const calculateParlayOdds = (bets) => {
    return bets.reduce((acc, bet) => acc * convertToDecimalOdds(bet.odds), 1);
  };

  const convertToDecimalOdds = (american) => {
    return american > 0
      ? (american / 100) + 1
      : (100 / Math.abs(american)) + 1;
  };

  const parlayOdds = bets.length > 0 ? calculateParlayOdds(bets) : null;
  const potentialWinnings = parlayOdds ? (wagerAmount * parlayOdds).toFixed(2) : null;

  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🎟️ Betting Slip</h2>
        {bets.length > 0 && (
          <button onClick={onClearBets} className="text-sm text-red-400 hover:underline">
            Clear All
          </button>
        )}
      </div>
      {bets.length === 0 ? (
        <p className="text-gray-400">No bets added yet.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {bets.map((bet, index) => (
              <li key={index} className="text-sm text-white border-b border-gray-600 pb-2 flex justify-between items-center">
                <div>
                  <p><strong>{bet.game}</strong></p>
                  <p>{bet.market.toUpperCase()} | {bet.team} | Odds: {bet.odds}</p>
                </div>
                <button onClick={() => onRemoveBet(index)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-green-400 font-semibold">
            Parlay Odds: {parlayOdds.toFixed(2)}
          </div>
          <div className="mt-1 text-yellow-300 font-semibold">
            Potential Winnings: ${potentialWinnings}
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
