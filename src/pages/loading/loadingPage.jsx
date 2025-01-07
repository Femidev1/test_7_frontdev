import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loadingPage.css";

function Loading() {
  const navigate = useNavigate();
  const isLocal = window.location.hostname === "localhost";
  const fixedTelegramId = "1297266722"; // ✅ Replace with a test ID
  const [error, setError] = useState("");

  useEffect(() => {
    let userFound = false;
    let telegramId = null;

    const createUser = async () => {
      try {
        if (isLocal) {
          console.log("✅ Running Locally - Using Fixed Telegram ID:", fixedTelegramId);
          telegramId = fixedTelegramId;
        } else if (window.Telegram?.WebApp) {
          const telegram = window.Telegram.WebApp;
          const userData = telegram.initDataUnsafe.user;
          if (!userData || !userData.id) {
            setError("Unable to retrieve Telegram user data.");
            return;
          }
          telegramId = userData.id.toString();
        } else {
          setError("Telegram WebApp API is not available. Open this app inside Telegram.");
          return;
        }

        const savedId = localStorage.getItem("telegramId");
        if (savedId) {
          userFound = true;
        } else {
          const res = await fetch("test-7-back.vercel.app/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId }),
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
      <div className="text_icons">
        <div className="text">
            QUACKARZ is here
        </div>
        <div className="icons">
          <img src=" https://res.cloudinary.com/dhy8xievs/image/upload/v1736231560/Telegram_kdi0cc.png ">
          </img>
          <img src=" https://res.cloudinary.com/dhy8xievs/image/upload/v1736231568/Twitter_s2bcgf.png ">
          </img>
          <img src=" https://res.cloudinary.com/dhy8xievs/image/upload/v1736231574/Youtube_hemtrr.png ">
          </img>
          <img src=" https://res.cloudinary.com/dhy8xievs/image/upload/v1736231587/Spotify_ymd79k.png ">
          </img>
        </div>
      </div>
      <div className="spinner"></div>
    </div>
  );
}

export default Loading;