import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let userFound = false;

    const createUser = async () => {
      try {
        // Attempt to see if we already have user ID in localStorage
        const savedId = localStorage.getItem("telegramId");
        if (savedId) {
          userFound = true;
        } else {
          // Fetch Telegram WebApp data
          const telegram = window.Telegram.WebApp;
          const userData = telegram.initDataUnsafe.user;

          if (!userData || !userData.id) {
            setError("Unable to retrieve Telegram user data.");
            return;
          }

          const telegramId = userData.id;
          const username = userData.username || "";
          const firstName = userData.first_name || "";
          const lastName = userData.last_name || "";
          const languageCode = userData.language_code || "";
          
          // Create or fetch user in backend
          const res = await fetch("https://test-7-back.vercel.app/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId, username, firstName, lastName, languageCode }),
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.user && data.user.telegramId) {
              localStorage.setItem("telegramId", data.user.telegramId);
              userFound = true;
            } else {
              setError("User creation failed.");
            }
          } else {
            setError("User creation failed.");
          }
        }
      } catch (err) {
        console.error("Error creating user:", err);
        setError("An error occurred. Please try again later.");
      }
    };

    // Call the function to create user
    createUser();

    // After 5 seconds, navigate to Home if user is found
    const timerId = setTimeout(() => {
      if (!error && userFound) {
        const id = localStorage.getItem("telegramId");
        if (id) navigate(`/home/${id}`);
      }
    }, 5000);

    return () => clearTimeout(timerId);
  }, [error, navigate]);

  if (error) {
    return (
      <div className="loading-container">
        <div className="loading-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loaderbackground"></div>
      <div className="spinner"></div>
    </div>
  );
}

export default Loading;