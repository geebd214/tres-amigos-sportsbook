// File: components/Sidebar.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaDollarSign,
  FaUserShield,
  FaTachometerAlt,
  FaHatCowboy
} from "react-icons/fa";

const baseLinks = [
  { to: "/", icon: <FaHatCowboy />, label: "Tres Amigos" },
  { to: "/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
  { to: "/make-bets", icon: <FaDollarSign />, label: "Make Bets" },
  { to: "/my-bets", icon: <FaChartLine />, label: "My Bets" },
];

export default function Sidebar({ user }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then(token => {
        setIsAdmin(token.claims.admin === true);
      });
    }
  }, [user]);

  const links = isAdmin
    ? [...baseLinks, { to: "/admin", icon: <FaUserShield />, label: "Admin" }]
    : baseLinks;

  return (
    <aside className="w-16 md:w-48 bg-gray-800 text-white flex flex-col">
      <div className="flex-1 p-2 space-y-4">
        {links.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-700 transition ${
              location.pathname === to ? "bg-gray-700 font-bold" : ""
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
