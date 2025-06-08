export default function BetCard({ bet }) {
  const parlayOdds = bet.bets?.reduce((oAcc, b) => {
    const dec = b.odds > 0 ? b.odds / 100 + 1 : 100 / Math.abs(b.odds) + 1;
    return oAcc * dec;
  }, 1) ?? 1;
  
  const profitLoss = bet.status === "win"
    ? bet.wagerAmount * parlayOdds
    : -bet.wagerAmount;

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
        <div>
          <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
            bet.status === "win" 
              ? "bg-green-900 text-green-200" 
              : bet.status === "lose"
              ? "bg-red-900 text-red-200"
              : "bg-yellow-900 text-yellow-200"
          }`}>
            {bet.status.toUpperCase()}
          </span>
          {bet.bets?.map((b, i) => (
            <p key={i} className="text-sm text-gray-300">
              {b.team} ({b.odds > 0 ? "+" : ""}{b.odds})
            </p>
          ))}
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${
            profitLoss >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <p className="mt-1 text-sm text-gray-300">
          Wager: ${bet.wagerAmount.toFixed(2)}
        </p>
        <p className="text-sm text-gray-300">
          Odds: {parlayOdds.toFixed(2)}x
        </p>
      </div>
    </div>
  );
} 