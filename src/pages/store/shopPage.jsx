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

  // Base URL for API requests
  const API_BASE_URL = "http://localhost:5050/api";

  // Fetch shop items from the backend
  useEffect(() => {
    const fetchShopItems = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/shop?userId=${telegramId}` // Pass userId in query params
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setShopItems(data); // Store fetched items in state
        setLoading(false);
      } catch (error) {
        console.error("Error fetching shop items:", error);
        toast.error("Failed to load shop items. Please try again later.");
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
        setSelectedItem(null); // Deselect item if clicked outside
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
        // Update the shop items state to reflect the purchase with data from backend
        const updatedItem = data.item; // Updated item from backend
        const updatedItems = shopItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        );
        setShopItems(updatedItems);
        setSelectedItem(updatedItem); // Update selected item with latest data
      } else {
        // Handle server-side validation errors
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
        // Update the shop items state to reflect the upgrade with data from backend
        const updatedItem = data.item; // Updated item from backend
        const updatedItems = shopItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        );
        setShopItems(updatedItems);
        setSelectedItem(updatedItem); // Update selected item with latest data
      } else {
        // Handle server-side validation errors
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
  const filteredItems = shopItems.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  if (loading) {
    return <div className="loading">Loading Shop...</div>;
  }

  return (
    <div className="shop-page">
    <div className="shopbackground"></div>
      {/* Top Bar */}
      <div className="shop-header">
        <h1 className="header-title">Shop</h1>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-button ${filter === "character" ? "active" : ""}`}
          onClick={() => setFilter("character")}
        >
          Characters
        </button>
        <button
          className={`filter-button ${filter === "engine" ? "active" : ""}`}
          onClick={() => setFilter("engine")}
        >
          Engines
        </button>
        <button
          className={`filter-button ${filter === "drone" ? "active" : ""}`}
          onClick={() => setFilter("drone")}
        >
          Drones
        </button>
      </div>

      {/* Item Grid */}
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
                {/* Display actual image if available, else use placeholder */}
                <img
                  src={item.imageUrl || "/placeholder.png"} // Ensure placeholder.png exists in public directory
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
                {/* Display item type with capitalized first letter */}
                <p className="item-type">
                  Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </p>
                {/* Conditional rendering of cost */}
                <p className="item-cost">
                  {item.locked
                    ? `Cost: ${item.baseCost} Points`
                    : `Upgrade Cost: ${item.upgradeCost} Points`}
                </p>
                {/* Display base points per cycle */}
                <p className="item-points">
                  +{item.basePoints} Points/Cycle
                </p>
                {/* Display item status */}
                <p className="item-status">
                  {item.locked ? "Locked" : "Unlocked"}
                </p>
                {/* Display item level if unlocked */}
                {item.level > 0 && (
                  <p className="item-level">Level: {item.level}</p>
                )}
                {/* Display upgraded points per cycle if unlocked */}
                {!item.locked && (
                  <p className="item-upgraded-points">
                    Points/Cycle: {item.pointsPerCycle}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">No items available in this category.</div>
        )}
      </div>

      {/* Conditional CTA Buttons */}
      {selectedItem && (
        <div className="cta-buttons" ref={ctaButtonsRef}>
          {selectedItem.locked ? (
            <button
              className="cta-button purchase"
              onClick={handlePurchase}
              disabled={actionLoading}
            >
              {actionLoading ? "Purchasing..." : "Purchase"}
            </button>
          ) : (
            <button
              className="cta-button upgrade"
              onClick={handleUpgrade}
              disabled={actionLoading}
            >
              {actionLoading ? "Upgrading..." : "Upgrade"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;