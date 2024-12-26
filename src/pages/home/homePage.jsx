import React, { useState, useEffect } from "react";
import "./homePage.css";
import duck from "../../assets/character1.png";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Home = ({ points, setPoints }) => {
  const navigate = useNavigate(); // Initialize navigate

  // State variables
  const [gradient, setGradient] = useState("linear-gradient(0deg, #00c6ff, #0072ff)");
  const [mining, setMining] = useState(false); // Track mining status
  const [miningProgress, setMiningProgress] = useState(0); // Track mining progress

  // Tap Count and Limit
  const [tapCount, setTapCount] = useState(
    parseInt(localStorage.getItem("tapCount"), 10) || 100
  ); // Persist tap count
  const tapLimit = 100; // Maximum tap limit
  const refillRate = tapLimit / 60; // Refill rate: 8 taps per second
  const refillInterval = 1000; // Refill interval in milliseconds (1 second)
  const [isRefilling, setIsRefilling] = useState(false); // Track refill status

  // Boost Cooldown
  const [boostCooldown, setBoostCooldown] = useState(0); // Remaining cooldown time (seconds)

  // Customizable colors for mine button
  const defaultColor = "#F4C20C";
  const miningFillColor = "white";

  // Function to handle taps
  const handleTap = () => {
    if (tapCount > 0) {
      setPoints(points + 1); // Increment points
      setTapCount((prev) => Math.max(prev - 1, 0)); // Decrement tap count
    }
  };

  // Persist state in localStorage
  useEffect(() => {
    localStorage.setItem("tapCount", tapCount);
  }, [tapCount]);

  // Dynamic refill logic
  useEffect(() => {
    let interval;
    if (tapCount < tapLimit) {
      setIsRefilling(true);
      interval = setInterval(() => {
        setTapCount((prev) => {
          if (prev >= tapLimit) {
            setIsRefilling(false);
            clearInterval(interval);
            return tapLimit; // Stop refill
          }
          return Math.min(prev + refillRate, tapLimit); // Increment dynamically
        });
      }, refillInterval);
    } else {
      setIsRefilling(false);
    }
    return () => clearInterval(interval); // Cleanup
  }, [tapCount, tapLimit, refillRate]);

  // Boost Logic
  const useBoost = () => {
    if (boostCooldown === 0) {
      setTapCount(tapLimit); // Instantly refill
      setBoostCooldown(60); // Cooldown for 60 seconds
    }
  };

  // Cooldown Timer Logic
  useEffect(() => {
    if (boostCooldown > 0) {
      const timer = setInterval(() => {
        setBoostCooldown((prev) => Math.max(prev - 1, 0));
      }, 1000); // Decrease by 1 second
      return () => clearInterval(timer);
    }
  }, [boostCooldown]);

  // Define progression levels
  const levels = [
    { min: 0, max: 100 },
    { min: 101, max: 200 },
    { min: 201, max: 300 },
    { min: 301, max: 400 },
    { min: 401, max: 500 },
    { min: 501, max: 600 },
    { min: 601, max: 700 },
  ];

  // Determine current level and progress
  const currentLevel = levels.find((level) => points >= level.min && points <= level.max) || levels[levels.length - 1];
  const levelProgress = ((points - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  // Generate a random gradient
  const getRandomBrightGradient = () => {
    const randomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;
    return `linear-gradient(0deg, ${randomColor()}, ${randomColor()})`;
  };

  // Effect to reset progress and update gradient
  useEffect(() => {
    if (levelProgress >= 100) {
      setPoints(currentLevel.max + 1);
      setGradient(getRandomBrightGradient());
    }
  }, [levelProgress, currentLevel.max, setPoints]);

  // Mining Logic
  useEffect(() => {
    const miningStart = parseInt(localStorage.getItem("miningStart"), 10);
  
    if (miningStart) {
      const updateMiningProgress = () => {
        const elapsedTime = Date.now() - miningStart;
        const progress = (elapsedTime / (5 * 60 * 1000)) * 100; // Total mining time is 5 minutes
  
        if (progress >= 100) {
          setPoints((prevPoints) => prevPoints + 20); // Add points when mining completes
          setMining(false);
          setMiningProgress(0);
          localStorage.removeItem("miningStart");
          return;
        }
  
        setMiningProgress(progress);
        setMining(true);
      };
  
      updateMiningProgress(); // Calculate progress immediately on load
      const interval = setInterval(updateMiningProgress, 1000); // Update progress every second
  
      return () => clearInterval(interval); // Cleanup interval on component unmount
    }
  }, [setPoints]);
  
  useEffect(() => {
    let interval;
    if (mining) {
      localStorage.setItem("miningStart", Date.now() - (miningProgress / 100) * 5 * 60 * 1000); // Persist elapsed time
      interval = setInterval(() => {
        setMiningProgress((prev) => {
          const nextProgress = prev + (100 / (5 * 60)); // Increment based on elapsed time
          if (nextProgress >= 100) {
            setPoints((prevPoints) => prevPoints + 20);
            setMining(false);
            localStorage.removeItem("miningStart");
            return 0; // Reset progress
          }
          return nextProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mining, miningProgress, setPoints]);

  const startMining = () => {
    if (!mining) {
      setMining(true);
      setMiningProgress(0);
      localStorage.setItem("miningStart", Date.now()); // Store start time in localStorage
    }
  };

  return (
    <div className="main">
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
            <div
              className="button"
              onClick={() => navigate("/store")}
            >
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
      <div className="bottom">
        <div className="tappingareaandprogress">
          <div className="tappingarea typeable-character" onClick={handleTap}>
            <img src={duck} alt="Character 1" />
          </div>
          <div className="planetprogress">
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{
                  height: `${levelProgress}%`,
                  background: gradient,
                  transition: "background 0.3s ease",
                }}
              ></div>
            </div>
          </div>
        </div>
        <div className="limitandboostandmine">
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
          <div className="minebutton">
            <button
              onClick={startMining}
              disabled={mining}
              style={{
                background: mining
                  ? `linear-gradient(to right, ${miningFillColor} ${miningProgress}%, ${defaultColor} ${miningProgress}%)`
                  : defaultColor,
                color: mining ? "black" : "black",
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