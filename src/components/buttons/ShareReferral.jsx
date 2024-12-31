// src/components/ShareReferral.js

import React, { useState } from "react";
import "./ShareReferral.css"; // Optional: For custom styling

const ShareReferral = ({ referralLink }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!referralLink) return;

    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="share-referral">
      <input
        type="text"
        value={referralLink}
        readOnly
        className="referral-input"
        onClick={(e) => e.target.select()} // Optional: Select text on click
      />
      <button onClick={copyToClipboard} className="copy-button">
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
};

export default ShareReferral;