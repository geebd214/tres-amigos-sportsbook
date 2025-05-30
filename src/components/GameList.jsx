// src/components/GameList.jsx
import React, { useEffect, useState } from 'react';
import { fetchOdds } from '../services/oddsApi';

const GameList = ({ sportKey }) => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const getOdds = async () => {
      try {
        const data = await fetchOdds(sportKey);
        setGames(data);
      } catch (error) {
        console.error(error);
      }
    };
    getOdds();
  }, [sportKey]);

  return (
    <div>
      {games.map((game) => (
        <div key={game.id}>
          <h3>
            {game.away_team} @ {game.home_team}
          </h3>
          {/* Display odds information here */}
        </div>
      ))}
    </div>
  );
};

export default GameList;
