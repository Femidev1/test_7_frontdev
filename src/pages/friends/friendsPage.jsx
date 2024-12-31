// src/pages/Friends/Friends.js

import React, { useState, useEffect, useContext } from "react";
import "./friendsPage.css";
import { UserContext } from "../../contexts/UserContext";
import ShareReferral from "../../components/buttons/ShareReferral";
import NativeShare from "../../components/buttons/NativeShare";

const Friends = () => {
  const { telegramId } = useContext(UserContext); // Fetch telegramId from context
  const [friends, setFriends] = useState([]);
  const [referralLink, setReferralLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [shareError, setShareError] = useState(null); // For handling sharing errors

  // Fetch Friends List
  const fetchFriends = async () => {
    try {
      const response = await fetch(`http://localhost:5050/api/friends/${telegramId}`); // Adjusted API endpoint
      if (!response.ok) throw new Error("Failed to fetch friends");
      const data = await response.json();
      setFriends(data.friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      // Optionally, set an error state to display in the UI
    }
  };

  // Fetch Referral Link
  const fetchReferralLink = async () => {
    try {
      const response = await fetch(`http://localhost:5050/api/referral/${telegramId}`); // Adjusted API endpoint
      if (!response.ok) throw new Error("Failed to fetch referral link");
      const data = await response.json();
      setReferralLink(data.referralLink);
    } catch (error) {
      console.error("Error fetching referral link:", error);
      // Optionally, set an error state to display in the UI
    }
  };

  useEffect(() => {
    if (telegramId) {
      fetchFriends();
      fetchReferralLink();
      setLoading(false); // Set loading to false after initiating fetch
    }
  }, [telegramId]);

  if (loading) {
    return <div className="loading">Loading friends...</div>;
  }

  return (
    <div className="friends-page">
      {/* Header Section */}
      <div className="header">
        <div className="friends-count">{friends.length} FRIENDS</div>
        <div className="reward-banner">
          <div className="savelogo">
            <div className="logo"></div>
          </div>
          <div className="description">
            <p>+50,000 TOKENS</p>
            <span>
              You get 50,000 tokens for inviting your quackies to come play with you.
            </span>
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div className="friends-list">
        {friends.length > 0 ? (
          friends.map((friend, index) => {
            const friendData = friend.friendId || {}; // Safeguard against missing friendId
            return (
              <div className="friend-card" key={index}>
                <div className="avatarandinfo">
                  <div className="friend-avatar">
                    <div className="avatar-placeholder"></div>
                  </div>
                  <div className="friend-info">
                    <h3>{friendData.username || "Unknown Friend"}</h3>
                    <p>{friendData.points || 0} Tokens</p>
                  </div>
                </div>
                <div className="friend-galaxy-level">
                  <p>Galaxy Level: {friendData.galaxyLevel || "1"}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-friends">You have no friends yet. Start inviting now!</div>
        )}
      </div>

      {/* Referral Sharing Section */}
      <div className="share-section">
        <h3>Invite Friends</h3>
        {referralLink ? (
          <div className="sharing-options">
            <ShareReferral referralLink={referralLink} />
            <NativeShare referralLink={referralLink} />
          </div>
        ) : (
          <p>Loading referral link...</p>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="navbar">
        <button className="nav-button">Home</button>
        <button className="nav-button">Leaderboard</button>
        <button className="nav-button">Quest</button>
        <button className="nav-button active">Friends</button>
      </div>
    </div>
  );
};

export default Friends;