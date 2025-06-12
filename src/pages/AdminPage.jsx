// File: pages/AdminPage.jsx

import { useEffect, useState } from "react";
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

export default function AdminPage() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");

  useEffect(() => {
    const fetchBets = async () => {
      const q = query(collection(db, "bets"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBets(fetched);
      setLoading(false);
    };
    fetchBets();
  }, []);

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
      prev.map((b) => (b.id === id ? { ...b, status: editedStatus } : b)),
    );
    setEditId(null);
  };

  if (loading) return <p className="p-4">Loading bets...</p>;

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Admin: Manage Bets</h2>
      <ul className="space-y-4">
        {bets.map((bet) => (
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
    </div>
  );
}
