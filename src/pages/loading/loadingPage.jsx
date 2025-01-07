// src/pages/loadingpage/LoadingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  // We'll no longer track numeric progress; instead, 
  // we show a spinner for 5 seconds
  useEffect(() => {
    let userFound = false;

    const checkUser = async () => {
      try {
        // Attempt to see if we already have user ID in localStorage
        const savedId = localStorage.getItem("telegramId");
        if (savedId) {
          userFound = true;
        } else {
          // Otherwise fetch from your backend
          const res = await fetch("https://test-7-back.vercel.app/api/getMe", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.telegramId) {
              localStorage.setItem("telegramId", data.telegramId);
              userFound = true;
            } else {
              setError("No user found. Please sign up or log in.");
            }
          } else {
            setError("No user found. Please sign up or log in.");
          }
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("An error occurred. Please try again later.");
      }
    };

    // 1) Attempt to get user data
    checkUser();

    // 2) After 5 seconds, if we have an ID, navigate to Home
    const timerId = setTimeout(() => {
      if (!error && userFound) {
        const id = localStorage.getItem("telegramId");
        if (id) navigate(`/home/${id}`);
      }
      // If there's an error, we remain on screen so user can see the error
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

  // Return the spinner-based loading screen
  return (
    <div className="loading-container">
      <div className="loaderbackground"></div>
      <div className="spinner"></div>
    </div>
  );
}

export default Loading;