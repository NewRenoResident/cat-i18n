import { useState, useRef, useCallback, useEffect } from "react";

export const useResizablePanel = (initialHeight = 300) => {
  const [panelHeight, setPanelHeight] = useState<number>(initialHeight);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const initialMouseYRef = useRef(0);
  const initialHeightRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    initialMouseYRef.current = e.clientY;
    initialHeightRef.current = panelHeight;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = initialMouseYRef.current - e.clientY;
    const newHeight = Math.min(
      Math.max(200, initialHeightRef.current + deltaY),
      window.innerHeight * 0.8
    );
    setPanelHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.documentElement.style.height =
      "" + (document.body.offsetHeight + panelHeight) + "px";
    return () => {
      document.documentElement.style.height =
        "" + (document.body.offsetHeight - panelHeight) + "px";
    };
  }, [panelHeight]);

  return {
    panelHeight,
    panelRef,
    handleMouseDown,
    setPanelHeight,
  };
};
