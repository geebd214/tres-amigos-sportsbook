// File: App.jsx

import { useEffect, useState } from "react";
import { auth, signInWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MakeBets from "./pages/MakeBets";
import MyBets from "./pages/MyBets";
import AdminPage from "./pages/AdminPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar user={user} />
        <div className="flex-1 overflow-y-auto">
          <header className="flex items-center justify-between p-4 border-b border-gray-700 shadow bg-gray-800">
            <h1 className="text-2xl font-bold">Tres Amigos Sportsbook</h1>
            <div>
              {!user ? (
                <button onClick={signInWithGoogle} className="px-4 py-2 bg-green-600 text-white rounded">
                  Sign in with Google
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="font-medium">Welcome, {user.displayName}</span>
                  <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/make-bets" />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/make-bets" element={<MakeBets user={user} />} />
            <Route path="/my-bets" element={<MyBets user={user} />} />
            <Route path="/admin" element={<AdminPage user={user}/>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
