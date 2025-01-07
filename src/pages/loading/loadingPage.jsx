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
        // Ensure Telegram WebApp API is available
        if (!window.Telegram || !window.Telegram.WebApp) {
          setError("Telegram WebApp API is not available. Open this app inside Telegram.");
          return;
        }

        // Get user data from Telegram WebApp API
        const telegram = window.Telegram.WebApp;
        const userData = telegram.initDataUnsafe.user;

        if (!userData || !userData.id) {
          setError("Unable to retrieve Telegram user data.");
          return;
        }

        // Extract user details
        const telegramId = userData.id.toString();
        const username = userData.username || "Unknown";
        const firstName = userData.first_name || "NoFirstName";
        const lastName = userData.last_name || "NoLastName";
        const languageCode = userData.language_code || "en";

        console.log("Sending user data:", { telegramId, username, firstName, lastName, languageCode });

        // Check if user already exists in localStorage
        const savedId = localStorage.getItem("telegramId");
        if (savedId) {
          userFound = true;
        } else {
          // Send a request to backend to create the user
          const res = await fetch("https://test-7-back.vercel.app/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId, username, firstName, lastName, languageCode }),
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && data?.user?.telegramId) {
            localStorage.setItem("telegramId", data.user.telegramId);
            userFound = true;
          } else {
            console.error("Server Response:", data);
            setError(data.message || "User creation failed.");
          }
        }
      } catch (err) {
        console.error("Error creating user:", err);
        setError("An error occurred. Please try again later.");
      }
    };

    createUser();

    // Navigate to Home after 5 seconds if user is found
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