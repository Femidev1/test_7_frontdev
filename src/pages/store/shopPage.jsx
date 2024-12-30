// src/pages/shop/Shop.js

import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../../contexts/UserContext";
import "./shopPage.css";

const Shop = () => {
  const { telegramId, points } = useContext(UserContext); // Access user data, including points
  const [shopItems, setShopItems] = useState([]); // State to store fetched shop items
  const [filter, setFilter] = useState("all"); // State to manage filters
  const [loading, setLoading] = useState(true); // State to track loading status
  const [selectedItem, setSelectedItem] = useState(null); // State to track selected item
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
        alert("Failed to load shop items. Please try again later.");
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
      alert("Please select a locked item to purchase.");
      return;
    }

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
        alert("Item purchased successfully!");
        // Update the shop items state to reflect the purchase
        const updatedItems = shopItems.map((item) =>
          item._id === selectedItem._id ? { ...item, locked: false } : item
        );
        setShopItems(updatedItems);
        setSelectedItem({ ...selectedItem, locked: false }); // Update selected item
      } else {
        // Handle server-side validation errors
        alert(data.message || "Failed to purchase item.");
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      alert("An error occurred while purchasing the item. Please try again.");
    }
  };

  // Handle Upgrade Action
  const handleUpgrade = async () => {
    if (!selectedItem || selectedItem.locked) {
      alert("Please select an unlocked item to upgrade.");
      return;
    }

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
        alert("Item upgraded successfully!");
        // Update the shop items state to reflect the upgrade
        const updatedItems = shopItems.map((item) =>
          item._id === selectedItem._id
            ? { ...item, level: (item.level || 1) + 1 }
            : item
        );
        setShopItems(updatedItems);
        setSelectedItem({
          ...selectedItem,
          level: (selectedItem.level || 1) + 1,
        }); // Update selected item
      } else {
        // Handle server-side validation errors
        alert(data.message || "Failed to upgrade item.");
      }
    } catch (error) {
      console.error("Error upgrading item:", error);
      alert("An error occurred while upgrading the item. Please try again.");
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
                />
              </div>
              <div className="item-details">
                <h2 className="item-name">{item.name}</h2>
                <p className="item-cost">Cost: {item.baseCost} Points</p>
                <p className="item-points">+{item.basePoints} Points</p>
                <p className="item-status">{item.locked ? "Locked" : "Unlocked"}</p>
                {item.level && <p className="item-level">Level: {item.level}</p>}
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
            <button className="cta-button purchase" onClick={handlePurchase}>
              Purchase
            </button>
          ) : (
            <button className="cta-button upgrade" onClick={handleUpgrade}>
              Upgrade
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;