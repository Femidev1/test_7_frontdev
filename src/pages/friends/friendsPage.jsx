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
      <div className="friendsbackground"></div>
      {/* Header Section */}
      <div className="header">
        <div className="countandlogo">
          <img 
                  src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634317/FriendsIcon_ew0ucf.png" 
                  alt="Token Icon" 
                  className="player-icon" 
          />
        <div className="friends-count">{friends.length} FRIENDS</div>
        </div>
        <div className="reward-banner">
          <div className="savelogo">
          <img
              src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735631352/Token_Icon_luv0et.png"
              alt="Token Icon"
              className="token-icon"
          />
          </div>
          <div className="description">
            <p>+50,000 $QKZ</p>
            <span>
              You get 50,000 $QKZ for inviting your quackies to come play with you.
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
          <div className="no-friends">You have no friends yet.</div>
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
    </div>
  );
};

export default Friends;