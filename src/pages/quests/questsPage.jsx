// Quests.jsx

import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./questsPage.css";
import { UserContext } from "../../contexts/UserContext";

const Quests = () => {
  const { telegramId: contextTelegramId } = useContext(UserContext); // From UserContext
  const { telegramId: paramTelegramId } = useParams(); // From URL params
  const navigate = useNavigate();

  const telegramId = contextTelegramId || paramTelegramId;

  const [quests, setQuests] = useState([]);
  const [filteredQuests, setFilteredQuests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [claimingQuestIds, setClaimingQuestIds] = useState([]);

  // Redirect if telegramId is not available
  useEffect(() => {
    if (!telegramId) {
      alert("Telegram ID is missing. Redirecting to the home page.");
      navigate("/");
    }
  }, [telegramId, navigate]);

  // Fetch quests from the backend
  const fetchQuests = async () => {
    try {
      console.log("Fetching quests with telegramId...");
      const response = await fetch(`http://localhost:5050/api/quests?telegramId=${telegramId}`);
      console.log("Response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch quests");
      const data = await response.json();
      console.log("Fetched quests:", data.quests);

      setQuests(data.quests);
      setFilteredQuests(data.quests);
    } catch (error) {
      console.error("Error fetching quests:", error);
      alert("Error fetching quests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Claim a quest
  const claimQuest = async (quest) => {
    const { _id: questId, nature } = quest;

    if (claimingQuestIds.includes(questId)) return;

    setClaimingQuestIds((prev) => [...prev, questId]);

    try {
      console.log(`Claiming quest with ID: ${questId}`);
      const response = await fetch(`http://localhost:5050/api/quests/${questId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });

      const result = await response.json();
      console.log("Claim quest response:", result);

      if (response.ok) {
        if (nature === "social") {
          // For social quests, inform the user that the claim is being processed
          alert(result.message);
          // Start a timer to refetch quests after 11 seconds (to allow backend to process the claim)
          setTimeout(() => {
            fetchQuests();
          }, 11000); // 11 seconds
        } else {
          // For other quest types, inform the user of successful claim
          alert(result.message);
          fetchQuests();
        }
      } else {
        alert(result.message || "Failed to claim the quest.");
      }
    } catch (error) {
      console.error("Error claiming quest:", error);
      alert("Error claiming quest. Please try again.");
    } finally {
      setClaimingQuestIds((prev) => prev.filter((id) => id !== questId));
    }
  };

  // Update filtered quests when filter changes
  useEffect(() => {
    if (filter === "all") {
      setFilteredQuests(quests);
    } else {
      const filtered = quests.filter((quest) => quest.nature === filter);
      setFilteredQuests(filtered);
    }
  }, [filter, quests]);

  // Fetch quests on component mount
  useEffect(() => {
    fetchQuests();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="quests-page">
      <div className="quests-header">
        <div className="header-title">Quests</div>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-button ${filter === "social" ? "active" : ""}`}
          onClick={() => setFilter("social")}
        >
          Socials
        </button>
        <button
          className={`filter-button ${filter === "points-based" ? "active" : ""}`}
          onClick={() => setFilter("points-based")}
        >
          Points-Based
        </button>
        <button
          className={`filter-button ${filter === "tap-based" ? "active" : ""}`}
          onClick={() => setFilter("tap-based")}
        >
          Tap-Based
        </button>
      </div>

      <div className="quests-list">
        {filteredQuests.length === 0 ? (
          <div>No quests available.</div>
        ) : (
          filteredQuests.map((quest) => (
            <div className="quest-card" key={quest._id}>
              <div className="quest-image">
                {quest.imageURL ? (
                  <img src={quest.imageURL} alt={quest.title} />
                ) : (
                  <div className="placeholder-box"></div>
                )}
              </div>
              <div className="quest-info">
                <h3 className="quest-title">{quest.title}</h3>
                <p className="quest-type">
                  {quest.nature === "social"
                    ? "Socials"
                    : quest.nature === "points-based"
                    ? "Points-Based"
                    : "Tap-Based"}
                </p>
                <p className="quest-reward">{quest.reward} Tokens</p>
              </div>
              <button
                className={`claim-button ${
                  (claimingQuestIds.includes(quest._id) || quest.isPending) ? "processing" : ""
                }`}
                onClick={() => claimQuest(quest)}
                disabled={claimingQuestIds.includes(quest._id) || quest.isClaimed || quest.isPending}
              >
                {claimingQuestIds.includes(quest._id) || quest.isPending ? (
                  <>
                    <span className="loading-spinner"></span>
                    {quest.isPending ? "Processing..." : ""}
                  </>
                ) : quest.isClaimed ? (
                  "Claimed"
                ) : (
                  "Claim"
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Quests;