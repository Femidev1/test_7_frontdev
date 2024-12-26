import React from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import "./navbar.css";

const Navbar = () => {
  return (
    <div className="navbar">
      <Link to="/" className="link">
        <div className="icon"></div>
        Home
      </Link>
      <Link to="/leaderboard" className="link">
        <div className="icon"></div>
        Leaderboard
      </Link>
      <Link to="/quest" className="link">
        <div className="icon"></div>
        Quests
      </Link>
      <Link to="/friends" className="link">
        <div className="icon"></div>
        Friends
      </Link>
    </div>
  );
};

export default Navbar;