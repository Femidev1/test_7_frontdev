import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [telegramId, setTelegramId] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreateUser = async () => {
      if (!window.Telegram || !window.Telegram.WebApp) {
        console.error("Telegram WebApp API is not available.");
        setLoading(false);
        return;
      }

      const telegram = window.Telegram.WebApp;
      const userData = telegram.initDataUnsafe?.user;

      if (!userData || !userData.id) {
        console.error("Unable to retrieve Telegram user data.");
        setLoading(false);
        return;
      }

      const telegramId = userData.id.toString();
      setTelegramId(telegramId);
      localStorage.setItem("telegramId", telegramId);

      try {
        // Step 1: Try to fetch existing user
        let res = await fetch(`https://test-7-back.vercel.app/api/user/${telegramId}`);
        let data = await res.json();

        if (res.ok) {
          console.log("User exists, fetching data...");
          setPoints(data.points || 0);
        } else {
          console.warn("User not found, creating new user...");

          // Step 2: If user does not exist, create it
          res = await fetch("https://test-7-back.vercel.app/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              telegramId,
              username: userData.username || "Unknown",
              firstName: userData.first_name || "NoFirstName",
              lastName: userData.last_name || "NoLastName",
              languageCode: userData.language_code || "en",
            }),
          });

          data = await res.json();

          if (res.ok) {
            console.log("User created successfully!");
            setPoints(data.user.points || 0);
          } else {
            console.error("Failed to create user:", data.message);
          }
        }
      } catch (error) {
        console.error("Error fetching/creating user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateUser();
  }, []);

  return (
    <UserContext.Provider value={{ telegramId, setTelegramId, points, setPoints, loading }}>
      {children}
    </UserContext.Provider>
  );
};