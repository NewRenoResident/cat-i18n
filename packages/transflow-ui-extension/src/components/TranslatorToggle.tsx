import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import PetsIcon from "@mui/icons-material/Pets";

export const TranslatorToggle = () => {
  const { isPanelVisible, setIsPanelVisible } = useTranslatorUI();
  const [position, setPosition] = useState({
    x: window.innerWidth - 70,
    y: window.innerHeight - 70,
  }); // Initial position bottom right
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null); // Ref for the button element
  const wasDraggedRef = useRef(false); // Ref to track if dragging occurred

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent default text selection behavior during drag
    // e.preventDefault(); // Sometimes needed, test if selection is an issue

    // Reset the dragged flag on each new mousedown
    wasDraggedRef.current = false;

    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true); // Set dragging state for visual feedback (e.g., cursor)

      // Add listeners to the window to track movement outside the button
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true }); // Use { once: true } for cleanup efficiency
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Set the dragged flag to true if mouse moves while button is pressed
      wasDraggedRef.current = true;

      // Ensure dragOffset is set (it should be if mousemove is listened to)
      if (!dragOffset.current) return;

      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // Constrain movement within the visible window bounds
      const elementWidth = nodeRef.current?.offsetWidth || 50;
      const elementHeight = nodeRef.current?.offsetHeight || 50;
      const maxX = window.innerWidth - elementWidth;
      const maxY = window.innerHeight - elementHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    },
    [
      /* No dependencies needed as refs and window are used */
    ]
  ); // setPosition is stable

  const handleMouseUp = useCallback(() => {
    setIsDragging(false); // Reset dragging state

    // Clean up the global mousemove listener
    document.removeEventListener("mousemove", handleMouseMove);

    // No need to remove mouseup listener if { once: true } was used
    // document.removeEventListener("mouseup", handleMouseUp);

    // Crucially, DO NOT reset wasDraggedRef here. Let handleClick check it.
  }, [handleMouseMove]); // handleMouseMove is included because it's removed here

  // Click handler to toggle the panel (only if no drag occurred)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check the ref: if the element was dragged, do nothing.
    if (wasDraggedRef.current) {
      // Optional: Reset the flag here if needed, though handleMouseDown already does.
      // wasDraggedRef.current = false;
      return;
    }

    // If it was a genuine click (no drag), toggle the panel
    // The check e.detail === 1 is good practice to ensure it's a single click
    if (e.detail === 1) {
      setIsPanelVisible(!isPanelVisible);
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Styles with Catppuccin Mocha
  const toggleStyles: React.CSSProperties = {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: "50px",
    height: "50px",
    backgroundColor: isDragging ? "#cba6f7" : "#89b4fa", // mauve during drag, blue otherwise
    color: "#1e1e2e", // base (icon color)
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: isDragging ? "grabbing" : "grab",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 1001,
    userSelect: "none",
    transition: "background-color 0.2s ease",
  };
  if (isPanelVisible) return null;

  return (
    <div
      ref={nodeRef}
      style={toggleStyles}
      onMouseDown={handleMouseDown}
      onClick={handleClick} // Keep onClick, but it will now check the flag
      title="Toggle Translator Panel"
    >
      <PetsIcon sx={{ fill: "white" }} />{" "}
    </div>
  );
};
