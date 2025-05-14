import React, {
  ReactElement,
  ReactNode,
  useState,
  useRef,
  useEffect,
} from "react";
import ReactDOM from "react-dom";
import { useTransFlow } from "./context";
import { useTranslatorUI } from "@cat-i18n/transflow-ui-extension";
import styles from "./Trans.module.css";

const popoverStyle: React.CSSProperties = {
  position: "fixed",
  background: "rgba(0, 0, 0, 0.8)",
  color: "white",
  padding: "5px 10px",
  borderRadius: "4px",
  fontSize: "12px",
  zIndex: 10000,
  pointerEvents: "none",
  whiteSpace: "pre-wrap",
  opacity: 0,
  transition: "opacity 0.2s ease-in-out, transform 0.1s ease-out",
  transform: "translateX(-50%) translateY(-100%)",
};
const popoverVisibleStyle: React.CSSProperties = {
  opacity: 1,
  transform: "translateX(-50%) translateY(calc(-100% - 5px))",
};

interface TransProps {
  id: string;
  variables?: Record<string, any>;
  components?: Record<string, ReactElement>;
  defaultMessage?: string;
}

export const Trans = ({
  id,
  variables,
  components,
  defaultMessage,
}: TransProps) => {
  const { t } = useTransFlow();
  const { isHighlightingEnabled } = useTranslatorUI();

  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [popoverContent, setPopoverContent] = useState<ReactNode>("");
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const highlightRef = useRef<HTMLSpanElement>(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  let translated = t(id, variables);

  let renderContent: ReactNode = translated;

  if (components) {
    const parts: ReactNode[] = [];
    const regex = /<(\w+)>(.*?)<\/\1>/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(translated)) !== null) {
      const [fullMatch, tag, content] = match;
      if (match.index > lastIndex) {
        parts.push(translated.slice(lastIndex, match.index));
      }
      if (components[tag]) {
        const Component = components[tag];
        try {
          parts.push(
            React.cloneElement(
              Component,
              { key: `${id}-${tag}-${match.index}` },
              content
            )
          );
        } catch (e) {
          console.error(`Failed to render component for tag ${tag}:`, e);
          parts.push(fullMatch);
        }
      } else {
        parts.push(fullMatch);
      }
      lastIndex = match.index + fullMatch.length;
    }
    if (lastIndex < translated.length) {
      parts.push(translated.slice(lastIndex));
    }
    renderContent = parts;
  }
  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!highlightRef.current) return;

    const rect = highlightRef.current.getBoundingClientRect();
    const contentToShow = (
      <>
        <b>Key:</b> {id}
      </>
    );

    setPopoverContent(contentToShow);
    setPopoverPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
    setIsPopoverVisible(true);
  };

  const handleMouseLeave = () => {
    setIsPopoverVisible(false);
  };

  const highlightedContent = (
    <span
      ref={highlightRef}
      className={styles["transflow-highlight"]}
      data-transflow-key={id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderContent}
    </span>
  );

  const popoverElement =
    isClient && isPopoverVisible
      ? ReactDOM.createPortal(
          <div
            style={{
              ...popoverStyle,
              ...(isPopoverVisible ? popoverVisibleStyle : {}),
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
          >
            {popoverContent}
          </div>,
          document.body
        )
      : null;

  if (isHighlightingEnabled) {
    return (
      <>
        {highlightedContent}
        {popoverElement}
      </>
    );
  }

  return <>{renderContent}</>;
};
