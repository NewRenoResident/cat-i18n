import React, { ReactElement, ReactNode } from "react";
import { useTransFlow } from "./context";
// Импортируем хук из нового пакета
import { useTranslatorUI } from "@cat-i18n/transflow-ui-extension";
import styles from './Trans.module.css'

interface TransProps {
  id: string;
  variables?: Record<string, any>;
  components?: Record<string, ReactElement>;
}

export const Trans: React.FC<TransProps> = ({ id, variables, components }) => {
  const { t } = useTransFlow();
  // Получаем состояние подсветки из контекста UI расширения
  const { isHighlightingEnabled } = useTranslatorUI(); // Используем хук

  let translated = t(id, variables);

  // --- Начало логики обработки компонентов (без изменений) ---
  if (!components) {
      // Оборачиваем простой текст, если подсветка включена
      if (isHighlightingEnabled) {
          return (
              <span
                  className={styles['transflow-highlight']} // CSS класс для стилизации
                  data-transflow-key={id}         // Атрибут с ключом перевода
                  title={`Key: ${id}`}            // Всплывающая подсказка с ключом
              >
                  {translated}
              </span>
          );
      }
      return <>{translated}</>;
  }

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
          React.cloneElement(Component, { key: `${id}-${parts.length}` }, content)
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
  // --- Конец логики обработки компонентов ---

  // Оборачиваем результат, если включена подсветка
  if (isHighlightingEnabled) {
    return (
      <span
        className={styles["transflow-highlight"]}
        data-transflow-key={id}
        title={`Key: ${id}`}
        // Можно добавить onClick для взаимодействия с панелью переводчика
        // onClick={() => { /* сообщить панели, что этот ключ выбран */ }}
      >
        {parts}
      </span>
    );
  }

  return <>{parts}</>;
};
