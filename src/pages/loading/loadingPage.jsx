import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [userFound, setUserFound] = useState(false); // Track user state

  useEffect(() => {
    const createUser = async () => {
      try {
        // Ensure Telegram WebApp API is available
        if (!window.Telegram || !window.Telegram.WebApp) {
          setError("Telegram WebApp API is not available. Open this app inside Telegram.");
          return;
        }

        // Get user data from Telegram WebApp API
        const telegram = window.Telegram.WebApp;
        const userData = telegram.initDataUnsafe?.user;

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
          setUserFound(true); // ✅ Set user as found
          return;
        }

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
          setUserFound(true); // ✅ Mark user as created
        } else {
          console.error("Server Response:", data);
          setError(data.message || "User creation failed.");
        }
      } catch (err) {
        console.error("Error creating user:", err);
        setError("An error occurred. Please try again later.");
      }
    };

    createUser();

    // Navigate to Home after 3 seconds if user is found
    const timerId = setTimeout(() => {
      if (!error && userFound) {
        const id = localStorage.getItem("telegramId");
        if (id) navigate(`/home/${id}`); // ✅ Corrected navigation
      }
    }, 3000);

    return () => clearTimeout(timerId);
  }, [error, navigate, userFound]); // ✅ Dependency fix

  // Show error if encountered
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
      <div className="text_icons">
        <div className="text">QUACKARZ is here</div>
        <div className="icons">
          <img src="https://res.cloudinary.com/dhy8xievs/image/upload/v1736231560/Telegram_kdi0cc.png" alt="Telegram" />
          <img src="https://res.cloudinary.com/dhy8xievs/image/upload/v1736231568/Twitter_s2bcgf.png" alt="Twitter" />
          <img src="https://res.cloudinary.com/dhy8xievs/image/upload/v1736231574/Youtube_hemtrr.png" alt="YouTube" />
          <img src="https://res.cloudinary.com/dhy8xievs/image/upload/v1736231587/Spotify_ymd79k.png" alt="Spotify" />
        </div>
      </div>
      <div className="spinner"></div>
    </div>
  );
}

export default Loading;