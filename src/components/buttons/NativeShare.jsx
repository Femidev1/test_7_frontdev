// src/components/NativeShare.js

import React from "react";
import "./NativeShare.css"; // Optional: For custom styling
import { toast } from "react-toastify";

const NativeShare = ({ referralLink }) => {
  const shareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Join Me in This Awesome Game!",
          text: "Check out this game and join me using my referral link:",
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