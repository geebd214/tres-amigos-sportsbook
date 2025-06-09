import { FaBasketballBall, FaFootballBall, FaBaseballBall } from 'react-icons/fa';
import { debug } from "../utils/debug.js";

export default function BetCard({ bet }) {
  debug.info('Rendering BetCard with bet:', bet);
  
  // Calculate parlay odds by multiplying decimal odds
  const parlayOdds = bet.bets?.reduce((oAcc, b) => {
    return oAcc * b.odds;
  }, 1) ?? 1;
  
  const profitLoss = bet.status === "win"
    ? bet.wagerAmount * (parlayOdds - 1)  // Subtract 1 to get profit only
    : -bet.wagerAmount;

  const potentialWinnings = bet.wagerAmount * (parlayOdds - 1);  // Subtract 1 to get profit only

  // Format the game time
  const gameTime = bet.gameTime ? new Date(bet.gameTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }) : '';

  // Get unique games
  const uniqueGames = [...new Set(bet.bets?.map(b => b.game))];

  // Get sport icon based on the first bet's sport
  const getSportIcon = () => {
    debug.info('Getting sport icon for bet:', bet);
    const sport = bet.bets[0]?.sport;
    debug.info('Sport from bet:', sport);
    
    if (!sport) {
      debug.warn('No sport found in bet');
      return null;
    }
    
    const sportKey = sport.toLowerCase();
    debug.info('Sport key:', sportKey);
    
    switch (sportKey) {
      case 'baseball_mlb':
        return <FaBaseballBall className="text-red-500" />;
      case 'basketball_nba':
        return <FaBasketballBall className="text-orange-500" />;
      case 'football_nfl':
        return <FaFootballBall className="text-brown-500" />;
      default:
        debug.warn(`No icon found for sport: ${sportKey}`);
        return null;
    }
  };

  const sportIcon = getSportIcon();

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
              {sportIcon}
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                bet.status === "win" 
                  ? "bg-green-900 text-green-200" 
                  : bet.status === "lose"
                  ? "bg-red-900 text-red-200"
                  : "bg-yellow-900 text-yellow-200"
              }`}>
                {bet.status.toUpperCase()}
              </span>
            </div>
            <p className={`text-lg font-semibold ${
              profitLoss >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
            </p>
          </div>

          {/* Game Information */}
          <div className="mb-3 p-2 bg-gray-800/50 rounded-lg">
            {uniqueGames.map((game, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <p className="text-sm font-medium text-gray-200">
                  {game}
                </p>
                <p className="text-xs text-gray-400">
                  {gameTime}
                </p>
              </div>
            ))}
          </div>

          {/* Bet Details */}
          <div className="space-y-2">
            {bet.bets?.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-300">
                    {b.market === 'spreads' ? 'Spread' : b.market === 'totals' ? 'Total' : 'Moneyline'}
                  </p>
                  <p className="text-sm font-medium text-gray-200">
                    {b.team} {b.point ? `(${b.point})` : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {b.odds.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-600">
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