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
                    <img 
                  src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634150/HomeIcon_icbfah.png" 
                  alt="Player Icon" 
                  className="nav-icon" 
                />
                <span>Home</span>
              </Link>
              <Link to={`/quests/${telegramId}`} className="link">
                  <img 
                  src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634151/QuestsIcon_fpw3nz.png" 
                  alt="Player Icon" 
                  className="nav-icon" 
                />
                <span>Quests</span>
              </Link>
              <Link to={`/leaderboard/${telegramId}`} className="link">
                  <img 
                  src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634150/LeaderboardIcon_lllgel.png" 
                  alt="Player Icon" 
                  className="nav-icon" 
                />
                <span>Leaderboard</span>
              </Link>
          </>
        )}
          <Link to={`/friends/${telegramId}`}  className="link">
            <img 
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634317/FriendsIcon_ew0ucf.png" 
                alt="Player Icon" 
                className="nav-icon" 
              />
            <span>Friends</span>
          </Link>
    </nav>
  );
};

export default Navbar;