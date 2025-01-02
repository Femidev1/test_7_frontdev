import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./homePage.css";
import duck from "../../assets/character1.png";
import { toast } from "react-toastify";
import CloseButton from "../../components/icons/closeIcon";

/**
 * Utility function to format large numbers into a compact string.
 * E.g., 1021000 becomes "1.02M".
 * Numbers less than 1,000 are shown as whole numbers (rounded up).
 *
 * @param {number} num - The number to format.
 * @returns {string} - The formatted number string.
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";

  if (num < 1000) {
    // Numbers less than 1,000 are rounded up to whole numbers
    return Math.ceil(num).toString();
  }

  const units = ["", "K", "M", "B", "T", "Q"];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (tier === 0) return num.toString();

  const unit = units[tier] || "Q"; // Default to "Q" if tier exceeds defined units
  const scaled = num / Math.pow(1000, tier);

  // Ensure two decimal places, but remove trailing zeros
  const formatted = scaled
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.[0-9])0$/, "$1");

  return `${formatted}${unit}`;
};

const Home = () => {
  // -------------------------------------
  //         GET TELEGRAM ID FROM URL
  // -------------------------------------
  const { telegramId } = useParams();
  const navigate = useNavigate();

  // -------------------------------------
  //             CONSTANTS
  // -------------------------------------
  const tapLimit = 100; // Maximum tap limit
  const boostCooldownSeconds = 60; // 60-second cooldown for boost
  const miningDurationMs = 1 * 60 * 1000; // 1 minute
  const miningReward = 20; // Points awarded after mining
  const refillRate = tapLimit / 60; // e.g., 100 taps in 60s => ~1.66 taps/s
  const tapBatchIntervalMs = 500; // Interval to send batched taps

  // -------------------------------------
  //             LOCAL STATE
  // -------------------------------------

  // Instead of 0, start as null to avoid overwriting DB on mount
  const [points, setPoints] = useState(null);

  // The player's display name from the DB (username or first+last)
  const [playerName, setPlayerName] = useState("Player Name");

  // Tapping
  const [tapCount, setTapCount] = useState(() => {
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });

  // New state for daily rewards
  const [dailyRewards, setDailyRewards] = useState([]);

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

  // Refs for intervals and timeouts
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Ref for tap buffer
  const tapBufferRef = useRef(0);
  const tapBatchIntervalRef = useRef(null);

  // State for floating taps
  const [flyingTaps, setFlyingTaps] = useState([]);

  // Refs for animations
  const tappingAreaRef = useRef(null);
  const tapContainerRef = useRef(null); // New ref for tap-animation

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

        // Set the player's points from DB (don't overwrite if null)
        setPoints(user.points ?? 0);

        // Construct a display name from username or fallback to first+last
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
  //    UPDATE POINTS IN DATABASE
  // -------------------------------------
  let isUpdatingPoints = false; // Add a flag to prevent multiple updates

  const updatePointsInDatabase = async (increment) => {
    if (!telegramId || isUpdatingPoints) return; // Prevent multiple updates
    isUpdatingPoints = true;

    try {
      const res = await fetch(`http://localhost:5050/api/user/${telegramId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: increment }),
      });

      if (!res.ok) throw new Error("Failed to update points");

      const data = await res.json();
      console.log("Updated Points Successfully:", data.totalPoints);
      return data.totalPoints;
    } catch (err) {
      console.error("Error updating points in DB:", err);
    } finally {
      isUpdatingPoints = false; // Reset flag
    }
  };

  // -------------------------------------
  //        LEVEL PROGRESSION LOGIC
  // -------------------------------------
  const levels = [
    { min: 0, max: 100 },
    { min: 101, max: 1000 },
    { min: 1001, max: 5000 },
    { min: 5001, max: 10000 },
    { min: 10001, max: 50000 },
    { min: 50001, max: 100000 },
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

  // If the user surpasses the level, move them up & update gradient
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
      const newCount = Math.min(prev + deltaSec * refillRate, tapLimit);
      localStorage.setItem("tapCount", newCount.toString());
      return newCount;
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
    const lastRefillTime =
      parseInt(localStorage.getItem("lastRefillTime") || "0", 10) || now;
    const diffMs = now - lastRefillTime;

    if (diffMs > 0) {
      const diffSeconds = diffMs / 1000;
      const tapsToAdd = diffSeconds * refillRate;
      setTapCount((prev) => {
        const newCount = Math.min(prev + tapsToAdd, tapLimit);
        localStorage.setItem("tapCount", newCount.toString());
        return newCount;
      });
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
    // Prevent boosting if tapCount is already at or above tapLimit
    if (boostCooldown === 0 && tapCount < tapLimit) {
      setTapCount(tapLimit);
      localStorage.setItem("tapCount", tapLimit.toString());
      setBoostCooldown(boostCooldownSeconds);
      localStorage.setItem("lastBoostUsedAt", Date.now().toString());

      // Show toast notification for boost
      toast.info("Boosted!");
    }
  };

  // -------------------------------------
  //         MINING LOGIC
  // -------------------------------------
  const startMining = async () => {
    if (!mining) {
      // Clear any existing intervals or timeouts to prevent overlaps
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setMining(true); // Start mining
      setMiningProgress(0); // Reset progress

      const miningStartTime = Date.now();
      localStorage.setItem(
        "miningData",
        JSON.stringify({
          isMining: true,
          startTime: miningStartTime,
          progress: 0,
        })
      );

      // Update progress at regular intervals
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - miningStartTime;
        const progress = Math.min((elapsed / miningDurationMs) * 100, 100);

        setMiningProgress(progress);
        localStorage.setItem(
          "miningData",
          JSON.stringify({
            isMining: true,
            startTime: miningStartTime,
            progress,
          })
        );

        if (progress >= 100) {
          clearInterval(intervalRef.current); // Stop the interval when progress is complete
        }
      }, 100); // Update progress every 100ms

      // Finalize mining after duration
      timeoutRef.current = setTimeout(async () => {
        clearInterval(intervalRef.current); // Clear the interval after timeout
        try {
          const res = await fetch(`http://localhost:5050/api/mine`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId }),
          });

          if (!res.ok) throw new Error("Failed to complete mining");

          const data = await res.json();
          setPoints((prev) => (prev !== null ? prev + data.minedPoints : data.minedPoints));
          setMining(false);
          setMiningProgress(0); // Reset progress for the next mining session

          // Show toast notification for mining completion
          toast.success(`You just got ${data.minedPoints} tokens!`);

          // Clear mining data from LocalStorage
          localStorage.setItem(
            "miningData",
            JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
          );
        } catch (err) {
          console.error("Error completing mining:", err);
          toast.error("An error occurred while completing mining. Please try again.");
          setMining(false);
          setMiningProgress(0); // Reset progress on error

          // Clear mining data from LocalStorage in case of error
          localStorage.setItem(
            "miningData",
            JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
          );
        }
      }, miningDurationMs); // Wait for the total mining duration
    }
  };

  // Restoring mining state on component mount or refresh
  useEffect(() => {
    const miningDataStr = localStorage.getItem("miningData");
    if (miningDataStr) {
      const { isMining, startTime, progress } = JSON.parse(miningDataStr);
      if (isMining) {
        const elapsed = Date.now() - startTime;
        const restoredProgress = Math.min((elapsed / miningDurationMs) * 100, 100);
        const remainingTime = miningDurationMs - elapsed;

        setMiningProgress(restoredProgress);
        setMining(true);

        if (restoredProgress < 100) {
          // Clear any existing intervals or timeouts
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Set up a new interval to update progress
          intervalRef.current = setInterval(() => {
            const newElapsed = Date.now() - startTime;
            const newProgress = Math.min((newElapsed / miningDurationMs) * 100, 100);

            setMiningProgress(newProgress);
            localStorage.setItem(
              "miningData",
              JSON.stringify({
                isMining: true,
                startTime,
                progress: newProgress,
              })
            );

            if (newProgress >= 100) {
              clearInterval(intervalRef.current);
            }
          }, 100);

          // Set up a timeout to finalize mining
          timeoutRef.current = setTimeout(async () => {
            clearInterval(intervalRef.current); // Clear interval
            try {
              const res = await fetch(`http://localhost:5050/api/mine`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ telegramId }),
              });

              if (!res.ok) throw new Error("Failed to complete mining");

              const data = await res.json();
              setPoints((prev) => (prev !== null ? prev + data.minedPoints : data.minedPoints));
              setMining(false);
              setMiningProgress(0);

              // Show toast notification for mining completion
              toast.success(`You just got ${data.minedPoints} tokens!`);

              // Clear mining data from LocalStorage
              localStorage.setItem(
                "miningData",
                JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
              );
            } catch (err) {
              console.error("Error completing mining:", err);
              toast.error("An error occurred while completing mining. Please try again.");
              setMining(false);
              setMiningProgress(0);

              // Clear mining data from LocalStorage in case of error
              localStorage.setItem(
                "miningData",
                JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
              );
            }
          }, remainingTime);
        } else {
          // Mining already completed
          setMining(false);
          setMiningProgress(0);
          localStorage.setItem(
            "miningData",
            JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
          );
        }
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------
  //           TAP HANDLER
  // -------------------------------------
  const handleTap = (e) => {
    if (tapCount >= 1 && points !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now(); // Unique ID for each tap

      // Add a new floating tap
      setFlyingTaps((prev) => [...prev, { id, x, y }]);

      // Increment the tap buffer
      tapBufferRef.current += 1;
      // Decrement tapCount and update localStorage
      setTapCount((prev) => {
        const newCount = Math.max(prev - 1, 0);
        localStorage.setItem("tapCount", newCount.toString());
        return newCount;
      });
      // Optimistically update points
      setPoints((prev) => (prev !== null ? prev + 1 : 1));

      // Trigger the tap animation by manipulating the class via tapContainerRef
      if (tapContainerRef.current) {
        tapContainerRef.current.classList.remove('tap-animation');

        // Trigger reflow to restart the animation
        void tapContainerRef.current.offsetWidth;

        tapContainerRef.current.classList.add('tap-animation');
      }
    }
  };

  // Handler to remove a floating tap after animation ends
  const handleAnimationEnd = (id) => {
    setFlyingTaps((prev) => prev.filter((tap) => tap.id !== id));
  };

  // Send batched taps to the backend at regular intervals
  useEffect(() => {
    const sendBatchedTaps = async () => {
      if (tapBufferRef.current > 0 && telegramId) {
        const increment = tapBufferRef.current;
        try {
          const res = await fetch(`http://localhost:5050/api/taps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              telegramId,
              increment,
            }),
          });

          if (!res.ok) throw new Error("Failed to update taps/points in backend");

          const data = await res.json();
          console.log("Batched Taps Updated Successfully:", data);
          // Update points based on backend response
          setPoints(data.totalPoints);
          // Reset the tap buffer
          tapBufferRef.current = 0;
        } catch (err) {
          console.error("Error updating batched taps in backend:", err);
          // Optionally, revert optimistic updates or notify the user
          setTapCount((prev) => Math.min(prev + tapBufferRef.current, tapLimit));
          tapBufferRef.current = 0;
          toast.error("Failed to update taps. Please try again.");
        }
      }
    };

    // Set up the interval
    tapBatchIntervalRef.current = setInterval(sendBatchedTaps, tapBatchIntervalMs);

    // Cleanup on unmount
    return () => {
      if (tapBatchIntervalRef.current) clearInterval(tapBatchIntervalRef.current);
    };
  }, [telegramId, tapBatchIntervalMs, tapLimit]);

  // Daily Rewards
  const [isDailyRewardsVisible, setIsDailyRewardsVisible] = useState(false);

  const toggleDailyRewards = () => {
    setIsDailyRewardsVisible((prev) => !prev);
  };

  const handleCollectReward = async () => {
    if (!telegramId) {
      toast.error("Telegram ID not found!");
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5050/api/daily-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || "Failed to collect daily reward");
      }
  
      setPoints((prev) => (prev !== null ? prev + data.pointsEarned : data.pointsEarned));
      toast.success(data.message || "Reward collected successfully!");
      toggleDailyRewards(); // Close the overlay after collecting
  
      // Re-fetch the daily rewards to update the claimed status
      const rewardsRes = await fetch(`http://localhost:5050/api/daily-rewards/${telegramId}`);
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setDailyRewards(rewardsData.rewards);
      }
    } catch (err) {
      console.error("Error collecting daily reward:", err);
      toast.error(err.message || "An error occurred while collecting your reward.");
    }
  };

  // -------------------------------------
  //         FETCH USER DATA & DAILY REWARDS
  // -------------------------------------
  useEffect(() => {
    if (!telegramId) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/user/${telegramId}`);
        if (!res.ok) throw new Error("Failed to fetch user data");
        const user = await res.json();

        // Set the player's points from DB (don't overwrite if null)
        setPoints(user.points ?? 0);

        // Construct a display name from username or fallback to first+last
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

    const fetchDailyRewards = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/daily-rewards/${telegramId}`);
        if (!res.ok) throw new Error("Failed to fetch daily rewards");
        const data = await res.json();
        setDailyRewards(data.rewards);
      } catch (err) {
        console.error("Error fetching daily rewards:", err);
      }
    };

    fetchUserData();
    fetchDailyRewards();
  }, [telegramId]);

  const isTodayRewardClaimed = () => {
    const todayString = new Date().toISOString().split("T")[0];
    return dailyRewards.some((reward) => reward.date === todayString && reward.claimed);
  };

  // -------------------------------------
  //           RENDER / JSX
  // -------------------------------------
  // If points is null, we haven't loaded the user's data yet
  return (
    <div className="main">
      <div className="homebackground"></div>
      {/* TOP SECTION */}
      <div className="top">
          {/* Daily Rewards Overlay */}
          {isDailyRewardsVisible && (
            <div className="overlay">
              <div className="overlay-content">
                <h2>Daily Rewards</h2>
                <p>Check back daily to keep your streak going and get better rewards!</p>
                <div className="rewards-grid">
                  {dailyRewards.map((reward) => {
                    const todayString = new Date().toISOString().split("T")[0];
                    let opacity = 0.7; // Default opacity

                    if (reward.date === todayString) {
                      opacity = reward.claimed ? 0.4 : 1; // 40% if claimed, 100% if available to claim
                    } else {
                      opacity = reward.claimed ? 0.4 : 0.7; // 40% if claimed, 70% otherwise
                    }

                    return (
                      <div
                        className="reward-item"
                        key={reward.day}
                        style={{
                          opacity: opacity,
                          pointerEvents: reward.claimed ? "none" : "auto",
                          cursor: reward.claimed ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (!reward.claimed && reward.date === todayString) {
                            handleCollectReward();
                          }
                        }}
                      >
                        <div className="day">
                          <span>Day {reward.day}</span>
                        </div>
                        <div className="reward">
                          <img
                            src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735631352/Token_Icon_luv0et.png"
                            alt="Token Icon"
                            className="player-icon"
                          />
                          <span>{reward.reward} $QKZ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  className={`collect-button ${isTodayRewardClaimed() ? 'not-claimable' : 'claimable'}`}
                  onClick={handleCollectReward}
                  disabled={isTodayRewardClaimed()}
                >
                  Collect Reward
                </button>
                <CloseButton onClick={toggleDailyRewards} />
              </div>
            </div>
          )}
        <div className="playerdetails">
          <div className="player">
            <img
              src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735790134/Quacker_qape6b.jpg"
              alt="Token Icon"
              className="header-icon"
            />
            {playerName}
          </div>
          <div className="playerpoints">
            <img
              src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735631352/Token_Icon_luv0et.png"
              alt="Token Icon"
              className="player-icon"
            />
            <h1>
              {points === null ? "Loading..." : formatNumber(points)}
            </h1>
          </div>
          <div className="buttons">
            {/* Modified Store Button */}
            <div className="button" onClick={() => navigate(`/shop/${telegramId}`)}>
              <img
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735632938/Store_Logo_hwal4f.png"
                alt="Store Icon"
                className="button-icon"
              />
              Store
            </div>
            <div className="button" onClick={toggleDailyRewards}>
              <img
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735632956/Daily_reward_Logo_vr95ch.png"
                alt="Daily Reward Icon"
                className="button-icon"
              />
              Daily Reward
            </div>
            <div className="button">
              <img
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735632939/Wallet_logo_hayttr.png"
                alt="Wallet Icon"
                className="button-icon"
              />
              Wallet
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="bottom">
        <div className="tappingareaandprogress">
          {/* Character for tapping */}
          <div
            className={`tappingarea typeable-character bobbing`}
            ref={tappingAreaRef}
            onClick={handleTap}
            style={{ position: "relative", overflow: "hidden" }} // Ensure floating taps are positioned correctly
          >
            {/* Inner Container for Tap Animation */}
            <div className="tap-container" ref={tapContainerRef}>
              <img src={duck} alt="Character" />
            </div>
            {/* Floating taps */}
            {flyingTaps.map((tap) => (
              <div
                key={tap.id}
                className="flying-tap"
                style={{ left: tap.x, top: tap.y }}
                onAnimationEnd={() => handleAnimationEnd(tap.id)}
              >
                +1
              </div>
            ))}
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
              // Disable if boost is on cooldown or tapCount is at/above tapLimit
              disabled={boostCooldown > 0 || tapCount >= tapLimit}
              className={`boost-button ${
                boostCooldown > 0 || tapCount >= tapLimit ? "disabled" : "active"
              }`}
            >
              {boostCooldown > 0
                ? `Boost (${boostCooldown}s)`
                : tapCount >= tapLimit
                ? "Boost (Max)"
                : "Boost"}
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