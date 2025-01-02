// src/pages/shop/Shop.jsx

import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./shopPage.css";

const Shop = () => {
  const { telegramId, points } = useContext(UserContext); // Access user data, including points
  const [shopItems, setShopItems] = useState([]); // State to store fetched shop items
  const [filter, setFilter] = useState("all"); // State to manage filters
  const [loading, setLoading] = useState(true); // State to track loading status
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item
  const [actionLoading, setActionLoading] = useState(false); // State to track action loading
  const itemGridRef = useRef(null); // Reference to the item grid
  const ctaButtonsRef = useRef(null); // Reference to the CTA buttons container

  const API_BASE_URL = "http://localhost:5050/api"; // Base URL for API requests

  // Fetch shop items from the backend
  useEffect(() => {
    const fetchShopItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/shop?userId=${telegramId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setShopItems(data);
      } catch (error) {
        console.error("Error fetching shop items:", error);
        toast.error("Failed to load shop items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (telegramId) {
      fetchShopItems();
    } else {
      console.warn("No telegramId found in UserContext.");
      setLoading(false);
    }
  }, [telegramId]);

  // Handle clicking outside the selected item and buttons to deselect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        itemGridRef.current &&
        !itemGridRef.current.contains(event.target) &&
        ctaButtonsRef.current &&
        !ctaButtonsRef.current.contains(event.target)
      ) {
        setSelectedItem(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Purchase Action
  const handlePurchase = async () => {
    if (!selectedItem || !selectedItem.locked) {
      toast.error("Please select a locked item to purchase.");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/shop/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: telegramId, itemId: selectedItem._id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Item purchased successfully!");
        const updatedItems = shopItems.map((item) =>
          item._id === data.item._id ? data.item : item
        );
        setShopItems(updatedItems);
        setSelectedItem(data.item);
      } else {
        toast.error(data.message || "Failed to purchase item.");
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast.error("An error occurred while purchasing the item. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Upgrade Action
  const handleUpgrade = async () => {
    if (!selectedItem || selectedItem.locked) {
      toast.error("Please select an unlocked item to upgrade.");
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/shop/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: telegramId, itemId: selectedItem._id }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Item upgraded successfully!");
        const updatedItems = shopItems.map((item) =>
          item._id === data.item._id ? data.item : item
        );
        setShopItems(updatedItems);
        setSelectedItem(data.item);
      } else {
        toast.error(data.message || "Failed to upgrade item.");
      }
    } catch (error) {
      console.error("Error upgrading item:", error);
      toast.error("An error occurred while upgrading the item. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter items based on the selected filter category
  const filteredItems = shopItems.filter((item) =>
    filter === "all" ? true : item.type === filter
  );

  if (loading) {
    return <div className="loading">Loading Shop...</div>;
  }

  return (
    <div className="shop-page">
      <ToastContainer 
        theme="dark" 
        className="custom-toast-container" // Added custom class
        position="top-center" // Optional: Position to top-center
      />
      <div className="shopbackground"></div>
      <div className="shop-header">
        <h1 className="header-title">Shop</h1>
      </div>

      <div className="filter-bar">
        {["all", "character", "engine", "drone"].map((type) => (
          <button
            key={type}
            className={`filter-button ${filter === type ? "active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="item-grid" ref={itemGridRef}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              className={`item-card ${item.locked ? "locked" : ""} ${
                selectedItem && selectedItem._id === item._id ? "selected" : ""
              }`}
              key={item._id}
              onClick={() => setSelectedItem(item)}
            >
              <div className="item-image">
                <img
                  src={item.imageUrl || "/placeholder.png"}
                  alt={item.name}
                  className="actual-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.png";
                  }}
                />
              </div>
              <div className="item-details">
                <h2 className="item-name">{item.name}</h2>
                <div className="desc">
                  {item.level > 0 && <p className="item-level">Lvl {item.level}</p>}
                  {!item.locked && (
                    <p className="item-upgraded-points">
                      + {item.pointsPerCycle} $Qkz/hr
                    </p>
                  )}
                </div>
                {/* Removed the item-cost paragraph */}
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">No items available in this category.</div>
        )}
      </div>

      {selectedItem && (
        <div className="cta-buttons" ref={ctaButtonsRef}>
          {selectedItem.locked ? (
            <button
              className="cta-button purchase"
              onClick={handlePurchase}
              disabled={actionLoading}
            >
              {actionLoading ? "Purchasing..." : `Purchase (${selectedItem.baseCost} Points)`}
            </button>
          ) : (
            <button
              className="cta-button upgrade"
              onClick={handleUpgrade}
              disabled={actionLoading}
            >
              {actionLoading ? "Upgrading..." : `Upgrade`}
              <div className="up">
                $QKZ {selectedItem.upgradeCost}
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;