import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [telegramId, setTelegramId] = useState(() => localStorage.getItem("telegramId") || null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!telegramId) {
        console.warn("No telegramId found. User data fetch skipped.");
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`http://localhost:5050/api/user/${telegramId}`);
        if (!response.ok) {
          console.error("Failed to fetch user data:", response.statusText);
          setLoading(false);
          return;
        }
        const userData = await response.json();
        setPoints(userData.points || 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [telegramId]);

  // Store telegramId in localStorage when it changes
  useEffect(() => {
    if (telegramId) {
      localStorage.setItem("telegramId", telegramId);
    }
  }, [telegramId]);

  return (
    <UserContext.Provider value={{ telegramId, setTelegramId, points, setPoints, loading }}>
      {children}
    </UserContext.Provider>
  );
};