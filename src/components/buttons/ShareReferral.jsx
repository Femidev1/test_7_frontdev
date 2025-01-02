import React from "react";
import { toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles
import "./ShareReferral.css"; // Custom styles

const ShareReferral = ({ referralLink }) => {
  const copyToClipboard = () => {
    if (!referralLink) return;

    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        toast.success("Share link copied!"); // Show Toastify notification
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy the referral link."); // Show error notification
      });
  };

  return (
    <button onClick={copyToClipboard} className="copy-button">
      <img 
        src="https://res.cloudinary.com/dhy8xievs/image/upload/v1735634150/LeaderboardIcon_lllgel.png" 
        alt="Copy Icon" 
        className="player-icon" 
      />
    </button>
  );
};

export default ShareReferral;