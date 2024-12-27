// TapTracker.jsx
import React, { useState, useEffect, useRef } from "react";
import duck from "../../assets/character1.png";

/**
 * TapTracker component
 *
 * Responsibilities:
 *  1. Manages a local tapCount that refills over time up to tapLimit.
 *  2. Sends an increment to the backend via /api/taps so the server can track total daily taps.
 *  3. Increments the user's total points by 1 each time (POST /user/:telegramId).
 *  4. Displays a tappable character that decrements tapCount with each click.
 *
 * Props:
 *  - telegramId: string (required) - user’s Telegram ID for backend calls
 *  - tapLimit: number (optional) - max number of taps (default 100)
 *  - refillSeconds: number (optional) - time in seconds to fully refill from 0 to tapLimit (default 60)
 *  - pointsPerTap: number (optional) - how many points each tap grants (default 1)
 */
function TapTracker({
  telegramId,
  tapLimit = 100,
  refillSeconds = 60,
  pointsPerTap = 1,
}) {
  // -------------------------------------
  //           REFILL LOGIC
  // -------------------------------------
  // Calculate how many taps to refill per second
  const refillRate = tapLimit / refillSeconds;

  // Local tapCount state
  const [tapCount, setTapCount] = useState(() => {
    // Try to load existing tapCount from localStorage
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });

  // For requestAnimationFrame
  const lastFrameTimeRef = useRef(0);

  /**
   * Refill logic using requestAnimationFrame
   * Continually replenishes tapCount toward tapLimit
   */
  const refillFrame = (timestamp) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }
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

  /**
   * On mount, fast-forward any taps that would've refilled since lastRefillTime
   */
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
    // eslint-disable-next-line
  }, []);

  /**
   * Whenever tapCount changes, persist to localStorage
   */
  useEffect(() => {
    localStorage.setItem("tapCount", tapCount.toString());
    if (tapCount < tapLimit) {
      startRefillAnimation();
    }
  }, [tapCount]);

  // -------------------------------------
  //         HANDLE TAP LOGIC
  // -------------------------------------
  /**
   * handleTap:
   *  1) Decrement local tapCount
   *  2) Call /api/taps to increment user.tapsMadeIn24Hrs
   *  3) Call /user/:telegramId to increment user's points by `pointsPerTap`
   */
  const handleTap = async () => {
    if (tapCount <= 0) return;
    if (!telegramId) return; // we must have an ID

    // Decrement local tap count first
    setTapCount((prev) => Math.max(prev - 1, 0));

    try {
      // 1) Increment user’s daily taps
      await fetch("http://localhost:5050/api/taps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          increment: 1, // One tap
        }),
      });

      // 2) Increment user’s total points
      //    Step A: Get current user data, so we know their current points
      const userRes = await fetch(`http://localhost:5050/api/user/${telegramId}`);
      if (!userRes.ok) throw new Error("Failed to fetch user for points update");
      const userData = await userRes.json();

      const updatedPoints = (userData.points || 0) + pointsPerTap;

      //    Step B: POST updated points to DB
      await fetch(`http://localhost:5050/api/user/${telegramId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: updatedPoints }),
      });
    } catch (err) {
      console.error("Error updating taps or points:", err);
    }
  };

  // -------------------------------------
  //             RENDER
  // -------------------------------------
  return (
    <div className="tap-tracker">
      {/* Tappable Character */}
      <div className="tapping-area" onClick={handleTap}>
        <img src={duck} alt="Tap Character" />
      </div>

      {/* Display how many taps remain */}
      <div className="tap-count-display">
        Taps Left: {Math.floor(tapCount)} / {tapLimit}
      </div>
    </div>
  );
}

export default TapTracker;