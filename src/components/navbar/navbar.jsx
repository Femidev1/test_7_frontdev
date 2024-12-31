// src/components/navbar/navbar.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext"; // Correct import
import "./navbar.css";

const Navbar = () => {
  const { telegramId, loading } = useContext(UserContext); // Consume UserContext

  console.log("Navbar - telegramId:", telegramId); // Debugging statement

  // Optionally, you can render a different navbar while loading
  if (loading) {
    return null; // Or render a loading spinner if desired
  }

  return (
    <nav className="navbar">

        {telegramId && (
          <>
              <Link to={`/home/${telegramId}`} className="link">
                <div className="icon"></div>
                <span>Home</span>
              </Link>
              <Link to={`/quests/${telegramId}`} className="link">
                <div className="icon"></div>
                <span>Quests</span>
              </Link>
              <Link to={`/leaderboard/${telegramId}`} className="link">
                <div className="icon"></div>
                <span>Leaderboard</span>
              </Link>
          </>
        )}
          <Link to={`/friends/${telegramId}`}  className="link">
            <div className="icon"></div>
            <span>Friends</span>
          </Link>
    </nav>
  );
};

export default Navbar;