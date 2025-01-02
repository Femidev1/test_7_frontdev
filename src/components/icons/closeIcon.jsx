import React from "react";
import CloseIcon from "@mui/icons-material/Close";

const CloseButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        position: "absolute",
        top: "10px",
        right: "10px",
      }}
    >
      <CloseIcon style={{ fontSize: "24px", color: "#fff" }} />
    </button>
  );
};

export default CloseButton;