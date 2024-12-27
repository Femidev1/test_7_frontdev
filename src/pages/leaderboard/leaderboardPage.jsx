// src/pages/leaderboard/leaderboardPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./leaderboardPage.css";

/**
 * Utility function to format large numbers into a compact string.
 * E.g., 1021000 becomes "1.02M".
 *
 * @param {number} num - The number to format.
 * @returns {string} - The formatted number string.
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";

  const units = ["", "K", "M", "B", "T", "Q"];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (tier === 0) return num.toString();

  const unit = units[tier] || "Q"; // Default to "Q" if tier exceeds defined units
  const scaled = num / Math.pow(1000, tier);

  // Ensure two decimal places, but remove trailing zeros
  const formatted = scaled.toFixed(2).replace(/\.00$/, "").replace(/(\.[0-9])0$/, "$1");

  return `${formatted}${unit}`;
};

const Leaderboard = () => {
  const { telegramId } = useParams(); // Retrieve telegramId from URL
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // Assuming similar filter functionality

  // Fetch leaderboard data from backend
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        const data = await response.json();
        setLeaderboardData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Optionally, implement filtering if your backend supports it
  // For simplicity, this example assumes all data is fetched and filtered client-side

  if (loading) {
    return <div className="loading">Loading Leaderboard...</div>;
  }

  return (
    <div className="leaderboard-page">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="header-icon"></div>
        <div className="header-title">Leaderboard</div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-button ${filter === "external" ? "active" : ""}`}
          onClick={() => setFilter("external")}
        >
          External
        </button>
        <button
          className={`filter-button ${filter === "in-game" ? "active" : ""}`}
          onClick={() => setFilter("in-game")}
        >
          In-Game
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {leaderboardData
          .filter((player) => {
            if (filter === "all") return true;
            return player.type === filter;
          })
          .map((player, index) => (
            <div
              className={`leaderboard-item ${
                player.telegramId === telegramId ? "current-user" : ""
              }`}
              key={player.telegramId}
            >
              {/* User Avatar */}
              <div className="user-avatar">
                {player.avatarURL ? (
                  <img src={player.avatarURL} alt={`${player.username}'s avatar`} />
                ) : (
                  <div className="placeholder-avatar"></div>
                )}
              </div>

              {/* User Info */}
              <div className="user-info">
                <div className="user-name">{player.username || "Player Name"}</div>
                <div className="user-tokens">{formatNumber(player.points)} Tokens</div>
              </div>

              {/* User Position */}
              <div className="user-position">{index + 1}</div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Leaderboard;