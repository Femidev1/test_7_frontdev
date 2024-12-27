// src/pages/home/homePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./homePage.css";
import duck from "../../assets/character1.png";
import { UserContext } from "../../contexts/UserContext";

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

const Home = () => {
  // -------------------------------------
  //        GET TELEGRAM ID FROM URL
  // -------------------------------------
  const { telegramId } = useParams();
  const navigate = useNavigate();

  // -------------------------------------
  //             CONSTANTS
  // -------------------------------------
  const tapLimit = 100;                    // Maximum tap limit
  const boostCooldownSeconds = 60;         // 60-second cooldown for boost
  const miningDurationMs = 5 * 60 * 1000;  // 5 minutes
  const miningReward = 20;                 // Points awarded after mining
  const refillRate = tapLimit / 60;        // e.g., 100 taps in 60s => ~1.66 taps/s

  // -------------------------------------
  //             LOCAL STATE
  // -------------------------------------

  // 1) Instead of 0, start as null to avoid overwriting DB on mount
  const [points, setPoints] = useState(null);

  // The player's display name from the DB (username / first + last)
  const [playerName, setPlayerName] = useState("Player Name");

  // Tapping
  const [tapCount, setTapCount] = useState(() => {
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });

  // Boost cooldown
  const [boostCooldown, setBoostCooldown] = useState(() => {
    const lastBoostUsedAt = parseInt(localStorage.getItem("lastBoostUsedAt") || "0", 10);
    if (!lastBoostUsedAt) return 0;
    const elapsed = Math.floor((Date.now() - lastBoostUsedAt) / 1000);
    const remaining = boostCooldownSeconds - elapsed;
    return remaining > 0 ? remaining : 0;
  });

  // Mining
  const [mining, setMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);

  // Gradient for the level/planet progress bar
  const [gradient, setGradient] = useState("linear-gradient(0deg, #00c6ff, #0072ff)");

  // -------------------------------------
  //         FETCH USER DATA
  // -------------------------------------
  useEffect(() => {
    if (!telegramId) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/user/${telegramId}`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const user = await res.json();

        // 1) Set the player's points from DB (don't overwrite if null)
        setPoints(user.points ?? 0);

        // 2) Construct a display name from username or fallback
        let displayName = user.username && user.username.trim()
          ? user.username.trim()
          : "";
        if (!displayName) {
          const fName = user.firstName ? user.firstName.trim() : "";
          const lName = user.lastName ? user.lastName.trim() : "";
          displayName = (fName + " " + lName).trim();
        }
        setPlayerName(displayName || "Player Name");
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [telegramId]);

  // -------------------------------------
  //     UPDATE POINTS IN DATABASE
  // -------------------------------------
  const updatePointsInDatabase = async (updatedPoints) => {
    if (!telegramId) return; // Must have ID

    try {
      const res = await fetch(`http://localhost:5050/api/user/${telegramId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: updatedPoints }),
      });
      if (!res.ok) throw new Error("Failed to update points");
    } catch (err) {
      console.error("Error updating points in DB:", err);
    }
  };

  // Whenever `points` changes (and is not null), post to the backend
  useEffect(() => {
    if (points !== null) {
      updatePointsInDatabase(points);
    }
  }, [points]);

  // -------------------------------------
  //       LEVEL PROGRESSION LOGIC
  // -------------------------------------
  // If your user might have more than 700 points, consider adjusting these:
  const levels = [
    { min: 0,      max: 100 },
    { min: 101,    max: 1000 },
    { min: 1001,   max: 5000 },
    { min: 5001,   max: 10000 },
    { min: 10001,  max: 50000 },
    { min: 50001,  max: 100000 },
    { min: 100001, max: 500000 },
    { min: 500001, max: 1000000 },
    { min: 1000001, max: 10000000 },
    { min: 10000001, max: 100000000001 },
  ];

  // If points=null, treat it like 0 for progression calculation
  const safePoints = points ?? 0;

  const currentLevel =
    levels.find((lvl) => safePoints >= lvl.min && safePoints <= lvl.max) ||
    levels[levels.length - 1];

  const levelProgress =
    ((safePoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  const getRandomBrightGradient = () => {
    const randomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;
    return `linear-gradient(0deg, ${randomColor()}, ${randomColor()})`;
  };

  // If user surpasses the level, move them up
  useEffect(() => {
    if (levelProgress >= 100 && points !== null) {
      setPoints(currentLevel.max + 1);
      setGradient(getRandomBrightGradient());
    }
  }, [levelProgress, currentLevel.max, points]);

  // -------------------------------------
  //         TAP REFILL LOGIC
  // -------------------------------------
  useEffect(() => {
    localStorage.setItem("tapCount", tapCount.toString());
  }, [tapCount]);

  const lastFrameTimeRef = useRef(0);

  const refillFrame = (timestamp) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const deltaSec = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;

    setTapCount((prev) => {
      if (prev >= tapLimit) return tapLimit;
      return Math.min(prev + deltaSec * refillRate, tapLimit);
    });

    if (tapCount < tapLimit) {
      requestAnimationFrame(refillFrame);
    }
  };

  const startRefillAnimation = () => {
    if (tapCount < tapLimit) {
      requestAnimationFrame(refillFrame);
    }
  };

  // On mount: fast-forward refill from lastRefillTime
  useEffect(() => {
    const now = Date.now();
    const lastRefillTime = parseInt(localStorage.getItem("lastRefillTime") || "0", 10) || now;
    const diffMs = now - lastRefillTime;

    if (diffMs > 0) {
      const diffSeconds = diffMs / 1000;
      const tapsToAdd = diffSeconds * refillRate;
      setTapCount((prev) => Math.min(prev + tapsToAdd, tapLimit));
    }

    localStorage.setItem("lastRefillTime", now.toString());
    startRefillAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tapCount < tapLimit) startRefillAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapCount]);

  // -------------------------------------
  //          BOOST LOGIC
  // -------------------------------------
  useEffect(() => {
    if (boostCooldown > 0) {
      const timer = setInterval(() => {
        setBoostCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [boostCooldown]);

  const useBoost = () => {
    if (boostCooldown === 0) {
      setTapCount(tapLimit);
      setBoostCooldown(boostCooldownSeconds);
      localStorage.setItem("lastBoostUsedAt", Date.now().toString());
    }
  };

  // -------------------------------------
  //         MINING LOGIC
  // -------------------------------------
  useEffect(() => {
    const miningDataStr = localStorage.getItem("miningData");
    if (miningDataStr) {
      try {
        const { isMining, startTime, rewarded } = JSON.parse(miningDataStr);
        if (isMining && !rewarded) {
          const elapsed = Date.now() - startTime;
          if (elapsed >= miningDurationMs) {
            // Mining finished; reward user
            setPoints((prev) => (prev !== null ? prev + miningReward : miningReward));
            localStorage.setItem(
              "miningData",
              JSON.stringify({ isMining: false, startTime: 0, rewarded: true })
            );
          } else {
            // Resume in-progress
            setMining(true);
            setMiningProgress((elapsed / miningDurationMs) * 100);
          }
        }
      } catch (err) {
        console.warn("Error parsing miningData from localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (mining) {
      interval = setInterval(() => {
        const miningDataStr = localStorage.getItem("miningData");
        if (!miningDataStr) return;

        const { startTime, rewarded } = JSON.parse(miningDataStr) || {};
        if (!startTime || rewarded) {
          clearInterval(interval);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= miningDurationMs) {
          // Done mining
          setPoints((prev) => (prev !== null ? prev + miningReward : miningReward));
          setMining(false);
          setMiningProgress(0);
          localStorage.setItem(
            "miningData",
            JSON.stringify({ isMining: false, startTime: 0, rewarded: true })
          );
          clearInterval(interval);
        } else {
          const progress = (elapsed / miningDurationMs) * 100;
          setMiningProgress(progress);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mining]);

  const startMining = () => {
    if (!mining) {
      setMining(true);
      setMiningProgress(0);
      localStorage.setItem(
        "miningData",
        JSON.stringify({
          isMining: true,
          startTime: Date.now(),
          rewarded: false,
        })
      );
    }
  };

  // -------------------------------------
  //           TAP HANDLER
  // -------------------------------------
  const handleTap = () => {
    if (tapCount > 0 && points !== null) {
      setPoints(points + 1);
      setTapCount((prev) => Math.max(prev - 1, 0));
    }
  };

  // -------------------------------------
  //           RENDER / JSX
  // -------------------------------------
  // If points is null, we haven't loaded the user's data yet
  return (
    <div className="main">
      {/* TOP SECTION */}
      <div className="top">
        <div className="playerdetails">
          <div className="player">
            <div className="icon"></div>
            {playerName}
          </div>
          <div className="playerpoints">
            <h1>
              {points === null
                ? "Loading..." // or 0, or some spinner
                : formatNumber(points)}
            </h1>
          </div>
          <div className="buttons">
            <div className="button" onClick={() => navigate("/store")}>
              <div className="icon"></div>
              Store
            </div>
            <div className="button">
              <div className="icon"></div>
              Daily Reward
            </div>
            <div className="button">
              <div className="icon"></div>
              Wallet
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="bottom">
        <div className="tappingareaandprogress">
          {/* Character for tapping */}
          <div className="tappingarea typeable-character" onClick={handleTap}>
            <img src={duck} alt="Character" />
          </div>

          {/* Planet progress bar */}
          <div className="planetprogress">
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{
                  height: `${levelProgress}%`,
                  background: gradient,
                  transition: "background 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>

        <div className="limitandboostandmine">
          {/* Tap limit + Boost */}
          <div className="limitandboost">
            <div className="taplimit">
              {Math.floor(tapCount)} / {tapLimit}
            </div>
            <button
              onClick={useBoost}
              disabled={boostCooldown > 0}
              className={`boost-button ${boostCooldown > 0 ? "disabled" : "active"}`}
            >
              {boostCooldown > 0 ? `Boost (${boostCooldown}s)` : "Boost"}
            </button>
          </div>

          {/* Mining button */}
          <div className="minebutton">
            <button
              onClick={startMining}
              disabled={mining}
              style={{
                background: mining
                  ? `linear-gradient(to right, white ${miningProgress}%, #F4C20C ${miningProgress}%)`
                  : "#F4C20C",
                color: "black",
                transition: "background 0.3s ease",
              }}
            >
              {mining ? `Mining... ${Math.floor(miningProgress)}%` : "Start Mining"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;