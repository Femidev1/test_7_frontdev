// src/pages/loading/loadingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [userFound, setUserFound] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(false);

  // List of image URLs to preload
  const imageUrls = [
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231560/Telegram_kdi0cc.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231568/Twitter_s2bcgf.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231574/Youtube_hemtrr.png",
    "https://res.cloudinary.com/dhy8xievs/image/upload/v1736231587/Spotify_ymd79k.png",
  ];

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const promises = imageUrls.map(
          (url) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.src = url;
              img.onload = resolve;
              img.onerror = reject;
            })
        );
        await Promise.all(promises);
        setImagesLoaded(true);
      } catch (err) {
        console.error("Error preloading images:", err);
        setError("Failed to load assets. Please try again later.");
      }
    };

    preloadImages();
  }, []);

  // Start a 5-second timer
  useEffect(() => {
    const timerId = setTimeout(() => {
      setTimerElapsed(true);
    }, 5000); // 5000 milliseconds = 5 seconds

    return () => clearTimeout(timerId);
  }, []);

  // Fetch or create user on component mount
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
          setUserFound(true);
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
          setUserFound(true);
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
  }, []);

  // Navigate to Home when user is found, images are loaded, and timer has elapsed
  useEffect(() => {
    if (userFound && imagesLoaded && timerElapsed && !error) {
      const id = localStorage.getItem("telegramId");
      if (id) {
        navigate(`/home/${id}`);
      }
    }
  }, [userFound, imagesLoaded, timerElapsed, error, navigate]);

  // Show error if encountered
  if (error) {
    return (
      <div className="loading-container">
        <div className="loading-error">{error}</div>
      </div>
    );
  }

  // Show loading animation while images are loading or timer hasn't elapsed
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
      {/* Removed the redundant spinner to prevent multiple spinners */}
    </div>
  );
}

export default Loading;