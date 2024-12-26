import React, { useEffect, useState } from "react";
import "./leaderboardPage.css";

const Leaderboard = () => {
  const [users, setUsers] = useState([]); // Leaderboard users
  const [currentUser, setCurrentUser] = useState(null); // Current user info
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        // Fetch top users
        const response = await fetch("http://localhost:5050/api/leaderboard?limit=10&page=1");
        const data = await response.json();
        setUsers(data);

        // Fetch current user data (replace with actual Telegram ID)
        const currentUserResponse = await fetch("http://localhost:5050/api/user/1297266722");
        const currentUserData = await currentUserResponse.json();
        setCurrentUser(currentUserData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="leaderboard">
      {/* Upper Section */}
      <div className="upper">
        <div className="header">
          <div className="item"></div>
          <div className="title">LEADERS</div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">Filter Bar with filters by galaxy</div>
      </div>

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {users.map((user, index) => (
          <div
            key={user.telegramId}
            className={`leaderboard-item ${
              currentUser?.telegramId === user.telegramId ? "current-user" : ""
            }`}
          >
            <div className="user-avatar">
              {/* User avatar or placeholder */}
              <div className="placeholder-avatar"></div>
            </div>
            <div className="user-info">
              <span className="user-name">{user.username || "leader Name"}</span>
              <span className="user-tokens">{user.points || 0} Tokens</span>
            </div>
            <div className="user-position">#{index + 1}</div>
          </div>
        ))}
      </div>

      {/* Highlight Current User */}
      {currentUser && (
        <div className="current-user-section">
          <div className="current-user-highlight">
            <div className="user-avatar">
              <div className="placeholder-avatar"></div>
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.username || "Player Name (User)"}</span>
              <span className="user-tokens">{currentUser.points || 0} Tokens</span>
            </div>
            <div className="user-position">Your Position</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;