import "./friendsPage.css";

const Friends = () => {
     // Placeholder data for friends
  const friends = [
    { name: "Friend 1", tokenCount: "1,000",  galaxyName: "Milky Way" },
    { name: "Friend 2", tokenCount: "3,500",  galaxyName: "Andromeda" },
    { name: "Friend 3", tokenCount: "2,200",  galaxyName: "Orion" },
    { name: "Friend 4", tokenCount: "5,000",  galaxyName: "Centauri" },
  ];

  return (
    <div className="friends-page">
      {/* Header Section */}
      <div className="header">
        <div className="friends-count">4 FRIENDS</div>
        <div className="reward-banner">
          <p>+50,000 TOKENS</p>
          <span>
            You get 50,000 tokens for inviting your quackies to come play with you.
          </span>
        </div>
      </div>

      {/* Friends List */}
      <div className="friends-list">
        {friends.map((friend, index) => (
          <div className="friend-card" key={index}>
            <div className="friend-avatar">
              <div className="avatar-placeholder"></div> {/* Placeholder for avatar */}
            </div>
            <div className="friend-info">
              <h3>{friend.name}</h3>
              <p>{friend.tokenCount} Tokens</p>
            </div>
            <div className="friend-galaxy-level">
              <p>
                    ({friend.galaxyName})
              </p>
            </div>
          </div>
        ))}
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