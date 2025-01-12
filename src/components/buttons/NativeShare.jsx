import React from "react";
import { toast } from "react-toastify";
import "./NativeShare.css";

const NativeShare = () => {
  // 1. Grab user’s Telegram ID from localStorage
  const telegramId = localStorage.getItem("telegramId") || "noUserId";

  // 2. Remove the "@" when constructing the bot username in URLs
  const botUsername = "Official_Quackarz_Bot"; 
  // 3. Append the referral parameter
  const botLink = `https://t.me/${botUsername}?start=${telegramId}`;

  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "🚀 Join Quackarz!",
          text: "Tap the link below to start earning in Quackarz on Telegram! 🦆💰",
          url: botLink, // Now includes ?start=<telegramId>
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      toast.error("Your browser does not support the native sharing feature.");
    }
  };

  return (
    <button onClick={shareLink} className="native-share-button">
      📤 Share Quackarz
    </button>
  );
};

export default NativeShare;