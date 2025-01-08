import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [telegramId, setTelegramId] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      console.warn("No token found in URL.");
      setLoading(false);
      return;
    }

    // Verify token with backend
    const verifyToken = async () => {
      try {
        const response = await fetch("https://test-7-back.vercel.app/auth/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          console.error("Token verification failed:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (!data.telegramId) {
          console.error("No telegramId returned from verification.");
          setLoading(false);
          return;
        }

        setTelegramId(data.telegramId);
        localStorage.setItem("telegramId", data.telegramId); // Store for persistence
      } catch (error) {
        console.error("Error verifying token:", error);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Fetch user data after setting Telegram ID
  useEffect(() => {
    if (!telegramId) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`https://test-7-back.vercel.app/api/user/${telegramId}`);
        if (!response.ok) {
          console.error("Failed to fetch user data:", response.statusText);
          return;
        }

        const userData = await response.json();
        setPoints(userData.points || 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [telegramId]);

  return (
    <UserContext.Provider value={{ telegramId, setTelegramId, points, setPoints, loading }}>
      {children}
    </UserContext.Provider>
  );
};