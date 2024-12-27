// src/pages/loading/LoadingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoadingPage.css";  // <-- Import your CSS

function Loading() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const savedId = localStorage.getItem("telegramId");
        if (savedId) {
          navigate(`/home/${savedId}`);
          return;
        }

        const res = await fetch("http://localhost:5050/api/getMe", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.telegramId) {
            localStorage.setItem("telegramId", data.telegramId);
            navigate(`/home/${data.telegramId}`);
            return;
          }
        }

        setError("No user found. Please sign up or log in.");
      } catch (err) {
        console.error("Error loading user:", err);
        setError("An error occurred. Please try again later.");
      }
    };

    checkUser();
  }, [navigate]);

  if (error) {
    // Show an error or direct to sign-up / login
    return (
      <div className="loading-container">
        <div className="loading-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-message">Loading...</div>
    </div>
  );
}

export default Loading;