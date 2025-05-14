import { AiClient } from "@cat-i18n/shared";

// URL API Deepseek по умолчанию
const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
// Модель Deepseek по умолчанию (выберите подходящую)
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

export interface DeepseekClientOptions {
  /** Пользовательский базовый URL для Deepseek API. */
  baseUrl?: string;
  /** Используемая модель Deepseek (например, 'deepseek-chat', 'deepseek-coder'). */
  model?: string;
  // Можно добавить другие параметры API Deepseek по необходимости (temperature, max_tokens и т.д.)
}

/**
 * Реализация AiClient для взаимодействия с Deepseek API.
 */
export class DeepseekAiClient implements AiClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  /**
   * Создает экземпляр DeepseekAiClient.
   * @param apiKey - Ваш API ключ для Deepseek.
   * @param options - Опциональные параметры конфигурации (baseUrl, model).
   */
  constructor(apiKey: string, options?: DeepseekClientOptions) {
    if (!apiKey) {
      throw new Error("Deepseek API key is required.");
    }
    this.apiKey = apiKey;
    this.apiUrl = options?.baseUrl || DEFAULT_DEEPSEEK_API_URL;
    this.model = options?.model || DEFAULT_DEEPSEEK_MODEL;

    console.log(
      `DeepseekAiClient initialized with URL: ${this.apiUrl} and model: ${this.model}`
    );
  }

  /**
   * Отправляет промпт в Deepseek API и возвращает обработанный JSON-ответ.
   * @param prompt - Текстовый промпт для AI.
   * @returns Объект с методом json(), возвращающим Promise с распарсенным JSON.
   */
  async post(prompt: string): Promise<{ json(): Promise<any> }> {
    const payload = {
      model: this.model,
      messages: [
        {
          role: "user", // или 'system' если нужно задать контекст
          content: prompt,
        },
      ],
      // Можно добавить другие параметры здесь, если нужно:
      // temperature: 0.7,
      // max_tokens: 1000,
      stream: false, // Нам нужен полный ответ, а не поток
      // response_format: { type: "json_object" } // Можно попробовать указать явно, если модель поддерживает
      // Но обычно достаточно инструкции в промпте
    };

    console.log("Sending request to Deepseek API..."); // Логирование

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorBody = "Could not read error body.";
        try {
          errorBody = await response.text();
        } catch (e) {
          /* Игнорируем ошибку чтения тела */
        }
        throw new Error(
          `Deepseek API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`
        );
      }

      // Получаем полный ответ от Deepseek API
      const responseData = await response.json();
      console.log("Received response from Deepseek API."); // Логирование

      // Извлекаем контент, сгенерированный AI
      // Структура ответа может немного отличаться, но обычно похожа на OpenAI
      const aiContentString = responseData?.choices?.[0]?.message?.content;

      if (
        typeof aiContentString !== "string" ||
        aiContentString.trim() === ""
      ) {
        console.error(
          "Unexpected Deepseek response structure or empty content:",
          responseData
        );
        throw new Error(
          "Failed to extract valid content string from Deepseek response."
        );
      }

      // Возвращаем объект, соответствующий интерфейсу AiClient
      // Метод json() парсит строку контента, которая *должна* быть валидным JSON
      return {
        json: async (): Promise<any> => {
          try {
            // Сначала проверяем, если строка контента обернута в кодовый блок Markdown
            let jsonText = aiContentString;
            if (aiContentString.trim().startsWith("```")) {
              // Извлекаем содержимое между маркерами кодового блока
              const matches = aiContentString.match(
                /```(?:json)?\s*([\s\S]*?)\s*```/
              );
              if (matches && matches[1]) {
                jsonText = matches[1];
              }
            }

            // Теперь парсим извлеченный JSON
            const parsedJson = JSON.parse(jsonText);
            console.log("Successfully parsed AI content as JSON."); // Логирование
            return parsedJson;
          } catch (parseError) {
            console.error("Failed to parse AI content as JSON:", parseError);
            console.error(
              "AI content string that failed parsing:",
              aiContentString
            ); // Очень важно для отладки
            throw new Error(
              `Failed to parse the AI's response content as JSON. Ensure the AI was instructed to return valid JSON.`
            );
          }
        },
      };
    } catch (error) {
      console.error("Error during Deepseek API call or processing:", error);
      // Перебрасываем ошибку, чтобы вызывающий код мог её обработать
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(
          `An unknown error occurred during the Deepseek API interaction: ${String(error)}`
        );
      }
    }
  }
}
