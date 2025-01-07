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

  const API_BASE_URL = "https://test-7-back.vercel.app/api"; // Base URL for API requests

  // -----------------------------
  // Fetch shop items from the backend
  // -----------------------------
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
  
        // ✅ Ensure `selectedItem` is `null` initially (avoiding pre-rendering buttons)
        setSelectedItem(null); 
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

  // -----------------------------
  // Handle clicking outside the selected item and buttons to deselect
  // -----------------------------
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

  // -----------------------------
  // Handle Purchase Action
  // -----------------------------
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
        // Update shop items
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

  // -----------------------------
  // Handle Upgrade Action
  // -----------------------------
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
  
        // Preserve `equipped` state while updating the item
        const updatedItems = shopItems.map((item) =>
          item._id === data.item._id
            ? { ...data.item, equipped: item.equipped } // ✅ Ensure equipped state is kept
            : item
        );
  
        setShopItems(updatedItems);
  
        // ✅ Ensure selectedItem is updated but retains equipped state
        setSelectedItem((prev) => ({
          ...data.item,
          equipped: prev.equipped, // ✅ Preserve equipped state
        }));
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

  // -----------------------------
  // NEW: Handle Equip Action
  // -----------------------------
  const handleEquip = async () => {
    if (!selectedItem) return;
    if (selectedItem.type !== "companion") {
      toast.error("Only companion items can be equipped.");
      return;
    }
    if (selectedItem.locked) {
      toast.error("Item is locked. Please purchase first.");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/shop/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: telegramId,
          itemId: selectedItem._id,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Companion equipped successfully!");

        // Update local state: set all companion items to equipped=false, then set chosen to true
        const updatedItems = shopItems.map((item) => {
          if (item.type === "companion") {
            return { ...item, equipped: false };
          }
          return item;
        });

        // Mark newly equipped item
        const index = updatedItems.findIndex((i) => i._id === selectedItem._id);
        if (index !== -1) {
          updatedItems[index] = {
            ...updatedItems[index],
            equipped: true,
            locked: false, // just re-assigning for clarity
          };
        }

        setShopItems(updatedItems);
        setSelectedItem({ ...selectedItem, equipped: true });
      } else {
        toast.error(data.message || "Failed to equip companion.");
      }
    } catch (error) {
      console.error("Error equipping companion:", error);
      toast.error("An error occurred while equipping the companion. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // -----------------------------
  // Filter items based on the selected filter category
  // -----------------------------
  const filteredItems = shopItems.filter((item) =>
    filter === "all" ? true : item.type === filter
  );

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) {
    return <div className="loading">Loading Shop...</div>;
  }

  return (
    <div className="shop-page">
      <ToastContainer
        theme="dark"
        className="custom-toast-container"
        position="top-center"
      />
      <div className="shopbackground"></div>
      <div className="shop-header">
        <h1 className="header-title">Shop</h1>
      </div>

      {/* Filter Buttons */}
      <div className="filter-bars">
        {["all", "companion", "engine", "drone"].map((type) => (
          <button
            key={type}
            className={`filter-button ${filter === type ? "active" : ""}`}
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid of Items */}
      <div className="item-grid" ref={itemGridRef}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
              <div
                className={`item-card ${item.locked ? "locked" : ""} ${
                  selectedItem && selectedItem._id === item._id ? "selected" : ""
                } ${item.equipped ? "equipped" : ""}`} // ✅ Apply equipped style properly
                key={item._id}
                onClick={() => setSelectedItem(item)}
              >
              <div className="item-image">
                <img
                  src={item.imageUrl || "/placeholder.png"}
                  alt={item.name}
                  className="actual-image" // This class will have the bobbing animation
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
                  {/* Show "Equipped" for equipped items (if you like) */}
                  {item.equipped && item.type === "companion" && (
                  <p className="equipped-label">Equipped</p>
                  )}
                  {!item.locked && (
                    <p className="item-upgraded-points">
                      + {item.pointsPerCycle} $QKZ/hr
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-items">No items available in this category.</div>
        )}
      </div>

{/* Action Buttons - Only Show When Item is Selected */}
      {selectedItem && !loading && (
       <div className={`cta-buttons ${selectedItem ? "show" : ""}`} ref={ctaButtonsRef}>
          {selectedItem.locked ? (
            // PURCHASE button for locked item
            <button
              className="cta-button purchase"
              onClick={handlePurchase}
              disabled={actionLoading}
            >
              {actionLoading ? "Purchasing..." : `Purchase $QKZ ${selectedItem.baseCost}`}
            </button>
          ) : (
            // UPGRADE button for unlocked item
            <button
              className="cta-button upgrade"
              onClick={handleUpgrade}
              disabled={actionLoading}
            >
              {actionLoading ? "Upgrading..." : "Upgrade"}
              <div className="up">$QKZ {selectedItem.upgradeCost}</div>
            </button>
          )}

          {/* EQUIP button (only for companions, unlocked) */}
          {selectedItem.type === "companion" && !selectedItem.locked && (
            <button
              className="cta-button equip"
              onClick={handleEquip}
              disabled={actionLoading || selectedItem.equipped}
            >
              {selectedItem.equipped ? "Equipped" : "Equip"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;