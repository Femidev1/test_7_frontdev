// src/pages/quests/questsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./questsPage.css";

const Quests = () => {
  const { telegramId } = useParams(); // Retrieve telegramId from URL
  const [quests, setQuests] = useState([]); // All quests
  const [filteredQuests, setFilteredQuests] = useState([]); // Filtered quests
  const [filter, setFilter] = useState("all"); // Filter state
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch quests data from backend
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await fetch("http://localhost:5050/api/quests");
        if (!response.ok) {
          throw new Error("Failed to fetch quests");
        }
        const data = await response.json();
        setQuests(data);
        setFilteredQuests(data); // Show all quests by default
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quests:", error);
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  // Update filtered quests when filter changes
  useEffect(() => {
    if (filter === "all") {
      setFilteredQuests(quests);
    } else {
      setFilteredQuests(quests.filter((quest) => quest.type === filter));
    }
  }, [filter, quests]);

  // Claim a quest
  const claimQuest = async (questId) => {
    try {
      const response = await fetch(`http://localhost:5050/api/quests/${questId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: telegramId }), // Use telegramId from params
      });

      const result = await response.json();
      if (response.ok) {
        // Update quest status in the frontend
        setQuests((prevQuests) =>
          prevQuests.map((quest) =>
            quest._id === questId ? { ...quest, isClaimed: true } : quest
          )
        );
        alert(result.message);
      } else {
        alert(result.message || "Failed to claim the quest.");
      }
    } catch (error) {
      console.error("Error claiming quest:", error);
      alert("Error claiming quest. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="quests-page">
      {/* Header */}
      <div className="quests-header">
        <div className="header-icon"></div>
        <div className="header-title">BEGIN</div>
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

      {/* Quests List */}
      <div className="quests-list">
        {filteredQuests.map((quest) => (
          <div className="quest-card" key={quest._id}>
            <div className="quest-image">
              {/* Use placeholder box if no image URL */}
              {quest.imageURL ? (
                <img src={quest.imageURL} alt={quest.title} />
              ) : (
                <div className="placeholder-box"></div>
              )}
            </div>
            <div className="quest-info">
              <h3 className="quest-title">{quest.title}</h3>
              <p className="quest-reward">{quest.reward} Tokens</p>
            </div>
            <button
              className="claim-button"
              onClick={() => claimQuest(quest._id)}
              disabled={quest.isClaimed} // Disable button if already claimed
            >
              {quest.isClaimed ? "Claimed" : "Claim"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quests;