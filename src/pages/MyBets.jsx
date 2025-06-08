// File: pages/MyBets.jsx

import { useState } from "react";
import { useUserBets, useFilteredBets } from "../hooks/useAppLogic";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import BetCard from "../components/BetCard";

function getFormattedDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function MyBets({ user }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { myBets } = useUserBets(user);
  
  console.log('All bets:', myBets);
  console.log('Selected date:', selectedDate);

  const filteredBets = useFilteredBets(
    myBets.filter((bet) => {
      const createdAt = bet.createdAt?.toDate?.();
      return createdAt?.toDateString?.() === selectedDate.toDateString();
    }),
    statusFilter
  );
  
  console.log('Filtered bets:', filteredBets);

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

  return (
    <div className="p-6">
      <style>
        {`
          html {
            overflow-y: scroll;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #1F2937;
          }
          ::-webkit-scrollbar-thumb {
            background: #4B5563;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}
      </style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">🦾 My Bets</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white hover:bg-gray-600"
          >
            <option value="all">All Bets</option>
            <option value="pending">Pending</option>
            <option value="win">Wins</option>
            <option value="lose">Losses</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-4">
        <button onClick={handlePrevious} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
          <FaChevronLeft />
        </button>
        <div className="text-lg font-semibold">
          {getFormattedDate(selectedDate)}
        </div>
        <button onClick={handleNext} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
          <FaChevronRight />
        </button>
      </div>

      <div className="space-y-4">
        {filteredBets.map((bet) => (
          <BetCard key={bet.id} bet={bet} />
        ))}

        {filteredBets.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No bets found for this date.
          </div>
        )}
      </div>
    </div>
  );
}
