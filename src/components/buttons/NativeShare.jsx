import React from "react";
import { toast } from "react-toastify"; // Ensure toast is imported for error handling
import "./NativeShare.css"; // Optional for styling

const NativeShare = () => {
  const botUsername = "@Official_Quackarz_Bot"; // Replace with your actual bot username
  const botLink = `https://t.me/${botUsername}`; // Telegram bot link

  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "🚀 Join Quackarz!",
          text: "Tap the link below to start earning in Quackarz on Telegram! 🦆💰",
          url: botLink, // Use the Telegram bot link
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for unsupported browsers
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