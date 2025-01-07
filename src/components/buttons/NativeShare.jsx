// src/components/NativeShare.js

import React from "react";
import "./NativeShare.css"; // Optional: For custom styling

const NativeShare = ({ referralLink }) => {
  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Quackarz Test Home!",
          text: "Join the QKZ test group as a test dev",
          url: referralLink,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for browsers that do not support the Share API
      toast("Your browser does not support the native sharing feature.");
    }
  };

  return (
    <button onClick={shareLink} className="native-share-button">
      Share via
    </button>
  );
};

export default NativeShare;