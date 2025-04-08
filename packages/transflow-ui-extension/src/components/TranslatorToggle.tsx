import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslatorUI } from "../context/TranslatorUIContext";
import PetsIcon from "@mui/icons-material/Pets";

export const TranslatorToggle = () => {
  const { isPanelVisible, setIsPanelVisible } = useTranslatorUI();
  const [position, setPosition] = useState({
    x: window.innerWidth - 70,
    y: window.innerHeight - 70,
  }); // Начальная позиция в нижнем правом углу
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null); // Ref для кнопки

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      // Добавляем слушатели на window для отслеживания движения вне кнопки
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Не используем `isDragging` из state напрямую в callback для window,
    // так как callback может "запомнить" старое значение state.
    // Вместо этого проверяем наличие dragOffset или используем ref для isDragging.
    if (dragOffset.current) {
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // Ограничиваем перемещение в пределах видимой области окна
      const maxX = window.innerWidth - (nodeRef.current?.offsetWidth || 50);
      const maxY = window.innerHeight - (nodeRef.current?.offsetHeight || 50);

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    }
  }, []); // Зависимостей нет, так как используем ref и window

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Удаляем слушатели с window
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]); // handleMouseMove включен как зависимость

  // Обработчик клика для переключения панели (только если не было перетаскивания)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.detail === 1) {
      setIsPanelVisible(!isPanelVisible);
    }
  };

  // Очистка слушателей при размонтировании компонента
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Стили с Catppuccin Mocha
  const toggleStyles: React.CSSProperties = {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: "50px",
    height: "50px",
    backgroundColor: isDragging ? "#cba6f7" : "#89b4fa", // mauve при перетаскивании, blue в обычном состоянии
    color: "#1e1e2e", // base (цвет иконки)
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: isDragging ? "grabbing" : "grab",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    zIndex: 1001, // Выше основного контента, но ниже панели (если панель 1000)
    userSelect: "none", // Предотвратить выделение текста при перетаскивании
    transition: "background-color 0.2s ease",
  };
  if (isPanelVisible) return null;

  return (
    <div
      ref={nodeRef}
      style={toggleStyles}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Toggle Translator Panel"
    >
      <PetsIcon sx={{ fill: "white" }} />
    </div>
  );
};
