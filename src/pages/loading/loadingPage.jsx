// src/pages/loading/loadingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // List of image URLs to preload
  const imageUrls = [
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231560/Telegram_kdi0cc.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231568/Twitter_s2bcgf.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231574/Youtube_hemtrr.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231587/Spotify_ymd79k.png",
  ];

  useEffect(() => {
    const preloadImages = () => {
      return Promise.all(
        imageUrls.map(
          (url) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.src = url;
              img.onload = resolve;
              img.onerror = reject;
            })
        )
      );
    };

    const fetchUser = async () => {
      // Ensure Telegram WebApp API is available
      if (!window.Telegram || !window.Telegram.WebApp) {
        throw new Error(
          "Telegram WebApp API is not available. Open this app inside Telegram."
        );
      }

      // Get user data from Telegram WebApp API
      const telegram = window.Telegram.WebApp;
      const userData = telegram.initDataUnsafe?.user;

      if (!userData || !userData.id) {
        throw new Error("Unable to retrieve Telegram user data.");
      }

      // Extract user details
      const telegramId = userData.id.toString();
      const username = userData.username || "Unknown";
      const firstName = userData.first_name || "NoFirstName";
      const lastName = userData.last_name || "NoLastName";
      const languageCode = userData.language_code || "en";

      console.log("Sending user data:", {
        telegramId,
        username,
        firstName,
        lastName,
        languageCode,
      });

      // Check if user already exists in localStorage
      const savedId = localStorage.getItem("telegramId");
      if (savedId) {
        return savedId;
      }

      // Send a request to backend to create the user
      const res = await fetch("https://test-7-back.vercel.app/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          username,
          firstName,
          lastName,
          languageCode,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data?.user?.telegramId) {
        localStorage.setItem("telegramId", data.user.telegramId);
        return data.user.telegramId;
      } else {
        console.error("Server Response:", data);
        throw new Error(data.message || "User creation failed.");
      }
    };

    const loadAll = async () => {
      try {
        // Create a 5-second delay promise
        const delay = new Promise((resolve) => setTimeout(resolve, 5000));

        // Start background tasks
        const preloadAndFetch = Promise.all([preloadImages(), fetchUser()]);

        // Wait for both the delay and the background tasks to complete
        const [_, results] = await Promise.all([delay, preloadAndFetch]);

        const telegramId = results[1]; // Assuming fetchUser returns telegramId

        // Navigate to home with the telegramId
        navigate(`/home/${telegramId}`);
      } catch (err) {
        console.error("Loading error:", err);
        setError(err.message);
      }
    };

    loadAll();
  }, [navigate, imageUrls]);

  // Show error if encountered
  if (error) {
    return (
      <div className="loading-container">
        <div className="loading-error">{error}</div>
      </div>
    );
  }

  // Show loading animation while loading
  return (
    <div className="loading-container">
      <div className="loaderbackground"></div>
      <div className="text_icons">
        <div className="text">QUACKARZ is here</div>
        <div className="icons">
          {imageUrls.map((url, index) => (
            <img key={index} src={url} alt={`Icon ${index}`} />
          ))}
        </div>
      </div>
      <div className="spinner"></div>
    </div>
  );
}

export default Loading;