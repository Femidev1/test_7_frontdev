// src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [telegramId, setTelegramId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Manually set the telegramId for testing
    const manualTelegramId = "1297266722"; // Replace with your desired test ID
    setTelegramId(manualTelegramId);
    setLoading(false);

    // Optionally, store it in localStorage
    localStorage.setItem("telegramId", manualTelegramId);
  }, []);

  return (
    <UserContext.Provider value={{ telegramId, setTelegramId, loading }}>
      {children}
    </UserContext.Provider>
  );
};