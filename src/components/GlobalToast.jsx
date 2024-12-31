// src/components/GlobalToast.jsx

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./GlobalToast.css"; // Import the custom CSS file

const GlobalToast = () => {
  return (
    <ToastContainer
      position="top-center" // Positioning the toast at the top-center
      autoClose={3000} // Toast will auto-close after 3 seconds
      hideProgressBar={false} // Show the progress bar
      newestOnTop={false} // Newest toast at the bottom
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark" // Enables dark mode
      style={{ marginTop: "24px" }} // Adds a top margin of 24 pixels
      toastClassName="custom-toast" // Assign your custom class here
    />
  );
};

export default GlobalToast;