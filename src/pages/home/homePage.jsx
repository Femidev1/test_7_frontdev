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
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";

  if (num < 1000) {
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
  //       GET TELEGRAM ID FROM URL
  // -------------------------------------
  const { telegramId } = useParams();
  const navigate = useNavigate();

  // -------------------------------------
  //             CONSTANTS
  // -------------------------------------
  const tapLimit = 100; 
  const boostCooldownSeconds = 60; 
  const miningDurationMs = 1 * 60 * 1000; // 1 minute
  const refillRate = tapLimit / 60; // e.g., 100 taps in 60s => ~1.66 taps/s
  const tapBatchIntervalMs = 500; // Interval to send batched taps
  const [characterUrl, setCharacterUrl] = useState("");

  // -------------------------------------
  //             LOCAL STATE
  // -------------------------------------
  const [points, setPoints] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [tapCount, setTapCount] = useState(() => {
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });

  // Daily rewards array from backend
  const [dailyRewards, setDailyRewards] = useState([]);

  // Boost cooldown
  const [boostCooldown, setBoostCooldown] = useState(() => {
    const lastBoostUsedAt = parseInt(localStorage.getItem("lastBoostUsedAt") || "0", 10);
    if (!lastBoostUsedAt) return 0;
    const elapsed = Math.floor((Date.now() - lastBoostUsedAt) / 1000);
    const remaining = boostCooldownSeconds - elapsed;
    return remaining > 0 ? remaining : 0;
  });

  // Mining states
  const [mining, setMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);

  // Planet progress bar gradient
  const [gradient, setGradient] = useState("linear-gradient(0deg, #00c6ff, #0072ff)");

  // Intervals/Timeouts
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const tapBatchIntervalRef = useRef(null);

  // Tap buffer & flying taps
  const tapBufferRef = useRef(0);
  const [flyingTaps, setFlyingTaps] = useState([]);

  // For animations
  const tappingAreaRef = useRef(null);
  const tapContainerRef = useRef(null);

  // Overlay states
  const [isDailyRewardsVisible, setIsDailyRewardsVisible] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  //Rewards Timer
  const [nextRewardCooldown, setNextRewardCooldown] = useState(0);

  // -------------------------------------
  //         FETCH USER DATA
  // -------------------------------------
  useEffect(() => {
    if (!telegramId) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/user/${telegramId}`);
        if (!res.ok) {
          console.warn("User not found! Resetting all stored data...");

          // Reset all stored data since the user is deleted
          localStorage.clear();

          // Reset UI states
          setNextRewardCooldown(0);
          setDailyRewards([]);
          setPoints(0);
          setPlayerName("Unknown");
          return null; // Explicitly return null to indicate failure
        }
        const user = await res.json();

        setPoints(user.points ?? 0);
        setCharacterUrl(user.characterUrl || "");

        let displayName = "";
        if (user.username && user.username.trim()) {
          displayName = user.username.trim();
        } else {
          const fName = user.firstName ? user.firstName.trim() : "";
          const lName = user.lastName ? user.lastName.trim() : "";
          displayName = (fName + " " + lName).trim();
        }
        setPlayerName(displayName || "Unknown");

        return user; // Return the fetched user data
      } catch (err) {
        console.error("Error fetching user data:", err);
        return null; // Return null in case of an error
      }
    };

    const initializeUser = async () => {
      const user = await fetchUserData();

      // If the user is new (i.e., rewards are empty or reset)
      if (!user || !user.lastLogin || user.rewardsClaimed === 0) {
        console.log("New user detected! Resetting rewards & timers...");

        // Clear local storage for rewards and cooldown
        localStorage.removeItem("nextRewardAvailableAt");
        localStorage.removeItem("dailyRewards");
        setNextRewardCooldown(0);
        setDailyRewards([]);
      }
    };

    const fetchDailyRewards = async () => {
      try {
        const res = await fetch(`http://localhost:5050/api/daily-rewards/${telegramId}`);
        if (!res.ok) throw new Error("Failed to fetch daily rewards");
    
        const data = await res.json();
        setDailyRewards(data.rewards || []);
    
        // ✅ Store rewards in localStorage
        localStorage.setItem(`dailyRewards_${telegramId}`, JSON.stringify(data.rewards || []));
      } catch (err) {
        console.error("Error fetching daily rewards:", err);
      }
    };

    initializeUser();
    fetchDailyRewards();
  }, [telegramId]);

  // -------------------------------------
  //     WELCOME OVERLAY BASED ON POINTS
  // -------------------------------------
  useEffect(() => {
    // If user's points are 0 or null => show the welcome overlay
    if (points === 0 || points === null) {
      setShowWelcomeOverlay(true);
    } else {
      setShowWelcomeOverlay(false);
    }
  }, [points]);

  const handleCloseWelcomeOverlay = () => {
    setShowWelcomeOverlay(false);
  };

  // -------------------------------------
  //    UPDATE POINTS IN DATABASE
  // -------------------------------------
  let isUpdatingPoints = false;
  const updatePointsInDatabase = async (increment) => {
    if (!telegramId || isUpdatingPoints) return;
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
      isUpdatingPoints = false;
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

  const safePoints = points ?? 0;
  const currentLevel =
    levels.find((lvl) => safePoints >= lvl.min && safePoints <= lvl.max) ||
    levels[levels.length - 1];

  const levelProgress =
    ((safePoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100;

  // Random bright gradient for next level
  const getRandomBrightGradient = () => {
    const randomColor = () => `hsl(${Math.random() * 360}, 100%, 50%)`;
    return `linear-gradient(0deg, ${randomColor()}, ${randomColor()})`;
  };

  // If the progress has hit or exceeded 100%, auto-level up
  useEffect(() => {
    if (levelProgress >= 100 && points !== null) {
      setPoints(currentLevel.max + 1); // Move user to the next level
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

  useEffect(() => {
    const now = Date.now();
    const lastRefillTime = parseInt(localStorage.getItem("lastRefillTime") || "0", 10) || now;
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
    if (boostCooldown === 0 && tapCount < tapLimit) {
      setTapCount(tapLimit);
      localStorage.setItem("tapCount", tapLimit.toString());
      setBoostCooldown(boostCooldownSeconds);
      localStorage.setItem("lastBoostUsedAt", Date.now().toString());
      toast.info("Boosted!");
    }
  };

  // -------------------------------------
  //         MINING LOGIC
  // -------------------------------------
  const startMining = async () => {
    if (mining) return; // Already mining? do nothing

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setMining(true);
    setMiningProgress(0);

    const miningStartTime = Date.now();
    localStorage.setItem(
      "miningData",
      JSON.stringify({
        isMining: true,
        startTime: miningStartTime,
        progress: 0,
      })
    );

    // Animate progress
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
      if (progress >= 100) clearInterval(intervalRef.current);
    }, 100);

    timeoutRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current);
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
        toast.success(`You just got ${data.minedPoints} QKZ!`);

        localStorage.setItem(
          "miningData",
          JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
        );
      } catch (err) {
        console.error("Error completing mining:", err);
        toast.error("An error occurred while completing mining. Please try again.");
        setMining(false);
        setMiningProgress(0);
        localStorage.setItem(
          "miningData",
          JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
        );
      }
    }, miningDurationMs);
  };

  // Restore mining progress on page reload
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
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          intervalRef.current = setInterval(() => {
            const newElapsed = Date.now() - startTime;
            const newProgress = Math.min((newElapsed / miningDurationMs) * 100, 100);
            setMiningProgress(newProgress);
            localStorage.setItem(
              "miningData",
              JSON.stringify({ isMining: true, startTime, progress: newProgress })
            );
            if (newProgress >= 100) clearInterval(intervalRef.current);
          }, 100);

          timeoutRef.current = setTimeout(async () => {
            clearInterval(intervalRef.current);
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
              toast.success(`You just got ${data.minedPoints} QKZ!`);
              localStorage.setItem(
                "miningData",
                JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
              );
            } catch (err) {
              console.error("Error completing mining:", err);
              toast.error("An error occurred while completing mining. Please try again.");
              setMining(false);
              setMiningProgress(0);
              localStorage.setItem(
                "miningData",
                JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
              );
            }
          }, remainingTime);
        } else {
          // Mining ended already
          setMining(false);
          setMiningProgress(0);
          localStorage.setItem(
            "miningData",
            JSON.stringify({ isMining: false, startTime: 0, progress: 0 })
          );
        }
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
      const id = Date.now();

      setFlyingTaps((prev) => [...prev, { id, x, y }]);
      tapBufferRef.current += 1;

      setTapCount((prev) => {
        const newCount = Math.max(prev - 1, 0);
        localStorage.setItem("tapCount", newCount.toString());
        return newCount;
      });
      setPoints((prev) => (prev !== null ? prev + 1 : 1));

      // Trigger tap animation class
      if (tapContainerRef.current) {
        tapContainerRef.current.classList.remove("tap-animation");
        void tapContainerRef.current.offsetWidth; // force reflow
        tapContainerRef.current.classList.add("tap-animation");
      }
    }
  };

  const handleAnimationEnd = (id) => {
    setFlyingTaps((prev) => prev.filter((tap) => tap.id !== id));
  };

  // -------------------------------------
  //    BATCH TAPS TO BACKEND (Interval)
  // -------------------------------------
  useEffect(() => {
    const sendBatchedTaps = async () => {
      if (tapBufferRef.current > 0 && telegramId) {
        const increment = tapBufferRef.current;
        try {
          const res = await fetch(`http://localhost:5050/api/taps`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId, increment }),
          });
          if (!res.ok) throw new Error("Failed to update taps/points in backend");

          const data = await res.json();
          console.log("Batched Taps Updated Successfully:", data);
          setPoints(data.totalPoints);
          tapBufferRef.current = 0;
        } catch (err) {
          console.error("Error updating batched taps in backend:", err);
          // If we fail, restore the tapCount to not lose taps:
          setTapCount((prev) => Math.min(prev + tapBufferRef.current, tapLimit));
          tapBufferRef.current = 0;
          toast.error("Failed to update taps. Please try again.");
        }
      }
    };

    tapBatchIntervalRef.current = setInterval(sendBatchedTaps, tapBatchIntervalMs);
    return () => {
      if (tapBatchIntervalRef.current) clearInterval(tapBatchIntervalRef.current);
    };
  }, [telegramId, tapBatchIntervalMs, tapLimit]);

  // -------------------------------------
  //       DAILY REWARDS LOGIC
  // -------------------------------------
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
  
      // ✅ Update Points Immediately
      setPoints((prev) => (prev !== null ? prev + data.pointsEarned : data.pointsEarned));
      toast.success(data.message || "Reward collected successfully!");
  
      // ✅ Store exact timestamp for next claim
      const nextClaimTimestamp = Date.now() + 86400 * 1000; // 24 hours from now in milliseconds
      localStorage.setItem(`nextRewardAvailableAt_${telegramId}`, nextClaimTimestamp.toString());
  
      // ✅ Calculate time left and update state
      const timeLeftInSeconds = Math.floor((nextClaimTimestamp - Date.now()) / 1000);
      setNextRewardCooldown(timeLeftInSeconds);
  
      // ✅ Re-fetch daily rewards immediately after claiming
      fetchDailyRewards();
    } catch (err) {
      console.error("Error collecting daily reward:", err);
      toast.error(err.message || "An error occurred while collecting your reward.");
    }
  };


  useEffect(() => {
    if (!telegramId) return;
  
    const storedTime = localStorage.getItem(`nextRewardAvailableAt_${telegramId}`);
  
    if (!storedTime || storedTime === "null") {
      setNextRewardCooldown(0);
    } else {
      const nextClaimTime = parseInt(storedTime, 10); // Stored timestamp in ms
      const currentTime = Date.now(); // Current time in ms
      const timeRemaining = Math.floor((nextClaimTime - currentTime) / 1000); // Convert ms to seconds
  
      if (timeRemaining <= 0) {
        setNextRewardCooldown(0);
        localStorage.removeItem(`nextRewardAvailableAt_${telegramId}`);
      } else {
        setNextRewardCooldown(timeRemaining);
      }
    }
  }, [telegramId]);

  useEffect(() => {
    if (nextRewardCooldown > 0) {
      const interval = setInterval(() => {
        setNextRewardCooldown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem(`nextRewardAvailableAt_${telegramId}`);
            return 0;
          }
  
          const newCooldown = prev - 1;
  
          // ✅ Store the updated countdown every second
          const nextClaimTimestamp = Date.now() + newCooldown * 1000;
          localStorage.setItem(`nextRewardAvailableAt_${telegramId}`, nextClaimTimestamp.toString());
  
          return newCooldown;
        });
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [nextRewardCooldown, telegramId]);

   // ✅ Define fetchDailyRewards at the top
   const fetchDailyRewards = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/daily-rewards/${telegramId}`);
      if (!res.ok) throw new Error("Failed to fetch daily rewards");

      const data = await res.json();
      setDailyRewards(data.rewards || []);

      // ✅ Store rewards in localStorage to persist across page reloads
      localStorage.setItem(`dailyRewards_${telegramId}`, JSON.stringify(data.rewards || []));
    } catch (err) {
      console.error("Error fetching daily rewards:", err);
    }
  };

    // ✅ PLACE THIS AFTER USER FETCH LOGIC
  useEffect(() => {
    if (!telegramId) return;

    // ✅ Check if rewards are stored in localStorage
    const storedRewards = localStorage.getItem(`dailyRewards_${telegramId}`);
    if (storedRewards) {
      setDailyRewards(JSON.parse(storedRewards));
    } else {
      fetchDailyRewards(); // Fetch from backend if not found locally
    }
  }, [telegramId]);

  // Identify the "next unclaimed" reward index
  const nextUnclaimedIndex = dailyRewards.findIndex((reward) => !reward.claimed);
  // If user has claimed everything, nextUnclaimedIndex could be -1
  // This means the user has no more unclaimed rewards
  const nextReward =
    nextUnclaimedIndex === -1 ? null : dailyRewards[nextUnclaimedIndex];

  // Determine if the next unclaimed reward is actually for "today"
  const todayString = new Date().toISOString().split("T")[0];
  const isNextRewardForToday = nextReward && nextReward.date === todayString;

  // We want the collect button to be "claimable" (yellow) only if there's a next reward
  // and its date is actually today
  const canCollectToday = Boolean(nextReward && isNextRewardForToday);

  /**
   * We also define a function to style each reward item:
   * - If index < nextUnclaimedIndex => past (collected)
   * - If index === nextUnclaimedIndex => next in line
   * - If index > nextUnclaimedIndex => future
   */
  const getRewardItemStyle = (reward, index) => {
    let style = {};
  
    if (index < nextUnclaimedIndex) {
      // ✅ Already collected (past rewards) → Low opacity, fully grayscale
      style = {
        opacity: 0.3,
        filter: "grayscale(100%)",
        pointerEvents: "none",
        cursor: "not-allowed",
      };
    } else if (index === nextUnclaimedIndex) {
      // ✅ Next in line (current reward to be claimed) → Full opacity & full color
      style = {
        opacity: 1,
        filter: "grayscale(0%)",
        transition: "opacity 0.3s ease, filter 0.3s ease",
      };
  
      // If it's today’s reward, allow clicking
      if (reward.date === todayString) {
        style.pointerEvents = "auto";
        style.cursor = "pointer";
      } else {
        style.pointerEvents = "none";
        style.cursor = "not-allowed";
      }
    } else {
      // ✅ Future rewards → Lower opacity & partial grayscale
      style = {
        opacity: 0.5,
        filter: "grayscale(50%)",
        pointerEvents: "none",
        cursor: "not-allowed",
        transition: "opacity 0.3s ease, filter 0.3s ease",
      };
    }
  
    return style;
  };

  // If we haven't loaded user data (playerName or points is null), show minimal UI or a spinner
  if (playerName === null || points === null) {
    return (
      <div className="main">
        <div className="homebackground" />
        <h3 style={{ color: "#fff" }}>Loading...</h3>
      </div>
    );
  }
  

  return (
    <div className="main">
      <div className="homebackground"></div>

      {/* WELCOME OVERLAY: If points=0 or null => show overlay */}
      {showWelcomeOverlay && (
        <div className="overlay" style={{ zIndex: 2000 }}>
          <div className="overlay-content">
            <div className="overlay_heading">
              <h2>Welcome, {playerName}!</h2>
              <p>Proceed to begin this journey, if you dare click</p>
            </div>
            <button
              style={{ marginTop: "20px", background: "#F4C20C", color: "#000" }}
              onClick={handleCloseWelcomeOverlay}
            >
              Quack
            </button>
          </div>
        </div>
      )}

      {/* TOP SECTION */}
      <div className="top">
        {/* Daily Rewards Overlay */}
        {isDailyRewardsVisible && (
  <div className="overlay">
    <div className="overlay-content">
      {/* Close Icon – separate from the Collect Reward button */}
      <div className="close-icon-container" onClick={toggleDailyRewards}>
        <CloseButton />
      </div>

      <h2>Daily Rewards</h2>
      <p>Check back daily to keep your streak going and get better rewards!</p>

      <div className="rewards-grid">
        {dailyRewards.map((reward, index) => {
          const itemStyle = getRewardItemStyle(reward, index);

          return (
            <div
              className="reward-item"
              key={reward.day}
              style={itemStyle}
              onClick={() => {
                if (index === nextUnclaimedIndex && reward.date === todayString && !reward.claimed) {
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

      {/* Single "Collect Reward" Button */}
      <button
        className={`collect-button ${nextRewardCooldown > 0 ? "not-claimable" : "claimable"}`}
        onClick={handleCollectReward}
        disabled={nextRewardCooldown > 0}
      >
        {nextRewardCooldown > 0
          ? `Next reward in ${new Date(nextRewardCooldown * 1000).toISOString().substr(11, 8)}`
          : "Collect Reward"}
      </button>
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
            <h1>{formatNumber(points)}</h1>
          </div>
          <div className="buttons">
            {/* Store Button */}
            <div className="button" onClick={() => navigate(`/shop/${telegramId}`)}>
              <img
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735632938/Store_Logo_hwal4f.png"
                alt="Store Icon"
                className="button-icon"
              />
              Store
            </div>

            {/* Daily Reward Button */}
            <div className="button" onClick={toggleDailyRewards}>
              <img
                src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735632956/Daily_reward_Logo_vr95ch.png"
                alt="Daily Reward Icon"
                className="button-icon"
              />
              Daily win
            </div>

            {/* Wallet Button */}
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
  className="tappingarea typeable-character bobbing"
  ref={tappingAreaRef}
  onClick={handleTap}
  style={{ position: "relative", overflow: "hidden" }}
>
  <div className="tap-container" ref={tapContainerRef}>
    <img
      src={characterUrl || duck}
      alt="Character"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = duck;
      }}
    />
  </div>

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
                  ? `linear-gradient(to right, white ${miningProgress}%, #555 ${miningProgress}%)`
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
