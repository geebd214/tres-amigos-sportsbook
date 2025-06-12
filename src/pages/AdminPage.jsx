import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

const PAGE_SIZE = 10;

export default function AdminPage() {
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [startDate, setStartDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      const q = query(collection(db, "bets"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBets(fetched);

      // Unique users for dropdown
      const users = Array.from(
        new Set(fetched.map((b) => b.userName).filter(Boolean))
      ).sort();
      setUniqueUsers(users);

      setLoading(false);
    };
    fetchBets();
  }, []);

  useEffect(() => {
    let filtered = [...bets];

    if (userFilter) {
      filtered = filtered.filter((b) => b.userName === userFilter);
    }

    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(
        (b) => b.createdAt?.toDate?.() >= start
      );
    }

    setFilteredBets(filtered);
    setCurrentPage(1); // Reset pagination when filters change
  }, [bets, userFilter, startDate]);

  const paginatedSlips = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return filteredBets.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredBets, currentPage]);


  const totalPages = Math.ceil(filteredBets.length / PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bet?")) return;
    await deleteDoc(doc(db, "bets", id));
    setBets((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEdit = (id, currentStatus) => {
    setEditId(id);
    setEditedStatus(currentStatus);
  };

  const handleSave = async (id) => {
    await updateDoc(doc(db, "bets", id), { status: editedStatus });
    setBets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: editedStatus } : b))
    );
    setEditId(null);
  };

  const clearFilters = () => {
    setUserFilter("");
    setStartDate("");
  };

  if (loading) return <p className="p-4">Loading bets...</p>;

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Admin: Manage Bets</h2>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1">Filter by User</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-10 px-3 py-1 text-sm bg-gray-700 text-white border border-gray-500 rounded"
          >
            <option value="">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 px-3 py-1 text-sm bg-gray-700 text-white border border-gray-500 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-300 mb-1 invisible">Clear</label>
          <button
            onClick={clearFilters}
            className="h-10 px-3 py-1 text-sm bg-gray-700 text-white border border-gray-500 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>


      <ul className="space-y-4">
        {paginatedSlips.map((bet) => (
          <li
            key={bet.id}
            className="border border-gray-600 bg-gray-800 p-4 rounded"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">
                  {bet.userName} | Placed:{" "}
                  {bet.createdAt?.toDate?.().toLocaleString?.() ?? "Unknown"}
                </p>
                <p className="text-white font-semibold">
                  Wager: ${bet.wagerAmount.toFixed(2)} — Status:{" "}
                  {editId === bet.id ? (
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="bg-gray-700 text-white border border-gray-500 rounded px-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="win">Win</option>
                      <option value="lose">Lose</option>
                    </select>
                  ) : (
                    <span className="uppercase">{bet.status}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {editId === bet.id ? (
                  <button
                    onClick={() => handleSave(bet.id)}
                    className="px-2 py-1 bg-green-600 text-white rounded"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(bet.id, bet.status)}
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(bet.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
            <ul className="mt-2 text-sm text-gray-200 list-disc ml-5">
              {bet.bets?.map((b, i) => (
                <li key={i}>
                  {b.game} — {b.market} — {b.team} ({b.odds})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-300 self-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
