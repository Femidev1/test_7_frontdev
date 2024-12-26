import React, { useState, useEffect, useRef } from "react";
import "./homePage.css";
import duck from "../../assets/character1.png";
import { useNavigate } from "react-router-dom";

const Home = ({ points, setPoints }) => {
  const navigate = useNavigate();

  // -------------------------------------
  //             CONSTANTS
  // -------------------------------------
  const tapLimit = 100;                   // Maximum tap limit
  const boostCooldownSeconds = 60;        // 60-second cooldown for boost
  const miningDurationMs = 5 * 60 * 1000; // 5 minutes to complete mining
  const miningReward = 20;               // Points awarded after mining completes

  // Refill rate: tapLimit / 60 taps per second => ~1.66 taps/sec if 100/60
  const refillRate = tapLimit / 60;

  // -------------------------------------
  //             LOCAL STATE
  // -------------------------------------
  const [tapCount, setTapCount] = useState(() => {
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });

  // Boost
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

  // For level progression & background
  const [gradient, setGradient] = useState("linear-gradient(0deg, #00c6ff, #0072ff)");

  // -------------------------------------
  //        LEVEL PROGRESSION LOGIC
  // -------------------------------------
  const levels = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
  ];

  const currentLevel =
    levels.find((level) => points >= level.min && points <= level.max) ||
    levels[levels.length - 1];

  const levelProgress =
    ((points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  const getRandomBrightGradient = () => {
    const randomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;
    return `linear-gradient(0deg, ${randomColor()}, ${randomColor()})`;
  };

  useEffect(() => {
    if (levelProgress >= 100) {
      setPoints(currentLevel.max + 1);
      setGradient(getRandomBrightGradient());
    }
  }, [levelProgress, currentLevel.max, setPoints]);

  // -------------------------------------
  //         TAP LOGIC (REFILL)
  // -------------------------------------
  // Save tapCount whenever it changes
  useEffect(() => {
    localStorage.setItem("tapCount", tapCount.toString());
  }, [tapCount]);

  // For our smooth animation refill, we track the last frame time
  const lastFrameTimeRef = useRef(0);

  // A helper function that refills taps each frame
  const refillFrame = (timestamp) => {
    // If we never stored a "lastFrameTime", set it now
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    // Compute how many seconds have passed since last frame
    const deltaSec = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;

    setTapCount((prev) => {
      if (prev >= tapLimit) {
        return tapLimit;
      }
      // Increase taps by (deltaSec * refillRate)
      const newCount = Math.min(prev + deltaSec * refillRate, tapLimit);

      // Update lastRefillTime in localStorage (so we can catch up later if user closes tab)
      localStorage.setItem("lastRefillTime", Date.now().toString());
      return newCount;
    });

    // Keep looping if not at max
    if (tapCount < tapLimit) {
      requestAnimationFrame(refillFrame);
    }
  };

  // A function to start the animation if needed
  const startRefillAnimation = () => {
    // Only start if we are below the limit
    if (tapCount < tapLimit) {
      requestAnimationFrame(refillFrame);
    }
  };

  // On mount: do immediate catch-up, then start the animation loop
  useEffect(() => {
    const now = Date.now();
    const storedRefillTime = parseInt(localStorage.getItem("lastRefillTime") || "0", 10);
    const lastRefillTime = storedRefillTime || now;

    // Perform immediate catch-up
    const diffMs = now - lastRefillTime;
    if (diffMs > 0) {
      const diffSeconds = diffMs / 1000;
      const tapsToAdd = diffSeconds * refillRate;
      setTapCount((prev) => Math.min(prev + tapsToAdd, tapLimit));
    }

    // Update lastRefillTime
    localStorage.setItem("lastRefillTime", now.toString());

    // Start the smooth refill animation
    startRefillAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever tapCount changes, if it goes below tapLimit, we re-start the animation
  useEffect(() => {
    if (tapCount < tapLimit) {
      startRefillAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapCount]);

  // -------------------------------------
  //         BOOST LOGIC
  // -------------------------------------
  useEffect(() => {
    if (boostCooldown > 0) {
      const timer = setInterval(() => {
        setBoostCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
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
            // Mining completed while away
            setPoints((prev) => prev + miningReward);
            localStorage.setItem(
              "miningData",
              JSON.stringify({ isMining: false, startTime: 0, rewarded: true })
            );
            setMining(false);
            setMiningProgress(0);
          } else {
            // Still mining
            setMining(true);
            setMiningProgress((elapsed / miningDurationMs) * 100);
          }
        }
      } catch (err) {
        console.warn("Error parsing miningData from localStorage", err);
      }
    }
  }, [setPoints]);

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
          setPoints((prev) => prev + miningReward);
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
  }, [mining, setPoints]);

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
  //         TAP / TICK HANDLER
  // -------------------------------------
  const handleTap = () => {
    if (tapCount > 0) {
      setPoints(points + 1);
      setTapCount((prev) => Math.max(prev - 1, 0));
    }
  };

  // -------------------------------------
  //        RENDER / JSX RETURN
  // -------------------------------------
  return (
    <div className="main">
      {/* TOP SECTION */}
      <div className="top">
        <div className="playerdetails">
          <div className="player">
            <div className="icon"></div>
            Player Name
          </div>
          <div className="playerpoints">
            <h1>{points}</h1>
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
          {/* Big tap area (character) */}
          <div className="tappingarea typeable-character" onClick={handleTap}>
            <img src={duck} alt="Character 1" />
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
          {/* Tap Limit & Boost */}
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

          {/* Mining Button */}
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
              {mining
                ? `Mining... ${Math.floor(miningProgress)}%`
                : "Start Mining"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;