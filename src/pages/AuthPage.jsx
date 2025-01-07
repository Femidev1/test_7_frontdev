// src/pages/AuthPage.jsx
import React, { useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

const AuthPage = () => {
  const { setTelegramId } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async (token) => {
      try {
        const response = await fetch(`https://test-7-back.vercel.app/api/auth/verify-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          credentials: "include", // Include credentials if needed
        });

        if (!response.ok) {
          console.error("Token verification failed:", response.statusText);
          alert("Invalid or expired token. Please restart the bot.");
          return;
        }

        const data = await response.json();
        console.log("Token verification successful:", data);

        if (data.telegramId) {
          setTelegramId(data.telegramId);
          navigate("/home"); // Redirect to Home after authentication
        } else {
          console.error("telegramId not found in response:", data);
          alert("Failed to retrieve Telegram ID. Please try again.");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        alert("An error occurred during authentication. Please try again.");
      }
    };

    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (token) {
      verifyToken(token);
    } else {
      console.warn("No token found in URL.");
      alert("No token provided. Please start the bot to receive an authentication link.");
    }
  }, [location.search, setTelegramId, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Authenticating...</h2>
      <p>Please wait while we verify your credentials.</p>
    </div>
  );
};

export default AuthPage;