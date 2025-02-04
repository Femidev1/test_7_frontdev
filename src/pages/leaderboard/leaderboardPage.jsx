// src/pages/leaderboard/leaderboardPage.jsx
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import "./leaderboardPage.css";

// Utility to format large numbers (1,550 => 1.5K, etc.)
const formatNumber = (num) => {
  if (!num) return "0";
  const units = ["", "K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (tier === 0) return num.toString();

  const unit = units[tier] || "T";
  const scaled = num / Math.pow(1000, tier);
  return `${scaled.toFixed(1).replace(/\.0$/, "")}${unit}`;
};

const Leaderboard = () => {
  const { telegramId, loading: contextLoading } = useContext(UserContext);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch data from /api/leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // If the context is still loading the telegramId, wait
        if (contextLoading) return;

        setLoading(true);
        // IMPORTANT: This must match your Express route exactly
        const response = await fetch("https://test-7-back.vercel.app/api/leaderboard");
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        const data = await response.json();

        // Now we have an array of user docs: e.g., [ { telegramId, points, ... }, ... ]
        setLeaderboardData(data);

        // Find the user that matches the telegramId from context
        const foundUser = data.find((player) => player.telegramId === telegramId);
        setCurrentUser(foundUser || null);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [telegramId, contextLoading]);

  // If still loading, show a placeholder
  if (loading || contextLoading) {
    return <div className="loading">Loading Leaderboard...</div>;
  }

  // Debugging: Confirm if user is found
  console.log("telegramId:", telegramId);
  console.log("leaderboardData:", leaderboardData);
  console.log("currentUser:", currentUser);

  return (
    <div className="leaderboard-page">
       <div className="leaderboardbackground"></div>
      {/* Header */}
      <div className="leaderboard-header">
        <img 
              src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634150/LeaderboardIcon_lllgel.png" 
              alt="Token Icon" 
              className="player-icon" 
            />
        <h1 className="header-title">Leaderboard</h1>
      </div>

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {leaderboardData
          .filter((player) => {
            if (filter === "all") return true;
            return player.type === filter; // or adapt to your data
          })
          .map((player, index) => (
            <div
              className={`leaderboard-item ${
                player.telegramId === telegramId ? "current-user" : ""
              }`}
              key={player.telegramId}
            >
              {/* Avatar */}
              <div className="user-avatar">
                {player.avatarURL ? (
                  <img src={player.avatarURL} alt={`${player.username}'s avatar`} />
                ) : (
                  <div className="placeholder-avatar"></div>
                )}
              </div>

              {/* User info */}
              <div className="user-info">
                <div className="user-name">{player.username || "Player Name"}</div>
                <div className="user-tokens">{formatNumber(player.points)} Tokens</div>
              </div>

              {/* Leaderboard position (1-based) */}
              <div className="user-position">{index + 1}</div>
            </div>
          ))}
      </div>

    </div>
  );
};

export default Leaderboard;