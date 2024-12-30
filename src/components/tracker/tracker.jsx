import React, { useState, useEffect, useRef } from "react";
import duck from "../../assets/character1.png";

function TapTracker({ telegramId, tapLimit = 100, refillSeconds = 60, pointsPerTap = 1 }) {
  const refillRate = tapLimit / refillSeconds; // Refill rate per second
  const [tapCount, setTapCount] = useState(() => {
    const saved = localStorage.getItem("tapCount");
    return saved ? parseFloat(saved) : tapLimit;
  });
  const lastFrameTimeRef = useRef(0);

  // Refill taps using requestAnimationFrame
  const refillFrame = (timestamp) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const deltaSec = (timestamp - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = timestamp;

    setTapCount((prev) => Math.min(prev + deltaSec * refillRate, tapLimit));
    if (tapCount < tapLimit) requestAnimationFrame(refillFrame);
  };

  const startRefillAnimation = () => {
    if (tapCount < tapLimit) requestAnimationFrame(refillFrame);
  };

  // Fast-forward refill on mount
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
  }, []);

  // Save tapCount to localStorage and ensure refill animation continues
  useEffect(() => {
    localStorage.setItem("tapCount", tapCount.toString());
    if (tapCount < tapLimit) startRefillAnimation();
  }, [tapCount]);

  const handleTap = async () => {
    if (tapCount <= 0 || !telegramId) {
      console.warn("No taps left or invalid telegramId.");
      return;
    }
  
    setTapCount((prev) => Math.max(prev - 1, 0));
  
    try {
      // Fetch user data to get current points
      const userResponse = await fetch(`http://localhost:5050/api/user/${telegramId}`);
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data. Status: ${userResponse.status}`);
      }
  
      const userData = await userResponse.json();
  
      // Ensure userData.points is valid
      if (typeof userData.points !== "number") {
        throw new Error("Invalid points value in user data.");
      }
  
      // Calculate the updated points
      const updatedPoints = userData.points + pointsPerTap;
  
      // Send POST request to update points
      const response = await fetch(`http://localhost:5050/api/taps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: updatedPoints }), // Send points as a number
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update user points. Status: ${response.status}`);
      }
  
      const responseData = await response.json();
  
      console.log(`Updated Points: ${responseData.points}`);
    } catch (err) {
      console.error("Error handling taps:", err.message || err);
    }
  };

  return (
    <div className="tap-tracker">
      <div className="tapping-area" onClick={handleTap}>
        <img src={duck} alt="Tap Character" />
      </div>
      <div className="tap-count-display">
        Taps Left: {Math.floor(tapCount)} / {tapLimit}
      </div>
    </div>
  );
}

export default TapTracker;