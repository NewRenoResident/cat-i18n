import { useTransFlow } from "@cat-i18n/scottish-fold";
import { Box, IconButton, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EditorPanel } from "./editor-panel";
import { ResizablePanel } from "../../../components/ResizablePanel";
import { useResizablePanel } from "../../../components/useResizablePanel";
import { PanelHeader } from "./panel-header";
import { ResizeHandle } from "../../../components/ResizeHandle";
import { KeysListPanel } from "./keys-list-panel";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslationAPI } from "../../../api/useTranslationAPI";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";
import { NotificationDialog } from "../../../base/notification/notification-dialog";
import { ThemeSwitcherPopover } from "../../../theme/theme-toggle";
import React from "react";
const triggerAutoTranslation = async (
  api: any,
  fromLocale: string,
  toLocale: string,
  userId: string
) => {
  const response = await api.post("api/translations/ai/translate", {
    json: {
      translateFromLocale: fromLocale,
      translateToLocale: toLocale,
      userId,
    },
    timeout: 180000,
  });

  if (!response || !response.ok) {
    let errorMsg = `Automated translation failed with status ${response?.status || "unknown"}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData?.error || errorMsg;
    } catch (e) {
      // Ignore error parsing error response
    }
    throw new Error(errorMsg);
  }

  return await response.json();
};

export const TranslatorPanel = () => {
  const { locale, setLocale, getAvailableLocales, availableLocales } =
    useTransFlow();
  const {
    isHighlightingEnabled,
    setHighlightingEnabled,
    setIsPanelVisible,
    api,
    userId = "TEST",
  } = useTranslatorUI();

  const [searchTerm, setSearchTerm] = useState("");
  const [autoTranslateFromLocale, setAutoTranslateFromLocale] =
    useState<string>("");
  const [autoTranslateToLocale, setAutoTranslateToLocale] =
    useState<string>("");
  const [selectedTranslationModel, setSelectedTranslationModel] =
    useState<string>("deepseek-chat");
  const [isExpended, setIsExpended] = useState(false);

  // State for the Notification Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const { panelHeight, panelRef, handleMouseDown } = useResizablePanel(300);

  const {
    translations,
    selectedKey,
    isLoading: isLoadingTranslations,
    handleSelectKey,
    handleSaveChanges,
  } = useTranslationAPI();

  const queryClient = useQueryClient();

  // Helper function to show the dialog
  const showNotification = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  // Handler to close the dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const autoTranslateMutation = useMutation({
    mutationFn: (variables: {
      fromLocale: string;
      toLocale: string;
      userId: string;
    }) =>
      triggerAutoTranslation(
        api,
        variables.fromLocale,
        variables.toLocale,
        variables.userId
      ),
    onSuccess: (data, variables) => {
      // Use NotificationDialog instead of alert
      showNotification(
        "Успех",
        `Автоматизированный перевод с '${variables.fromLocale}' на '${variables.toLocale}' успешно завершен! ${data?.data?.message || ""}`
      );
      queryClient.invalidateQueries({ queryKey: ["translations", locale] });
      queryClient.invalidateQueries({
        queryKey: ["translations", variables.toLocale],
      });
      queryClient.invalidateQueries({
        queryKey: ["translations", variables.fromLocale],
      });
    },
    onError: (error: Error, variables) => {
      console.error("Automated Translation error:", error);
      // Use NotificationDialog instead of alert
      showNotification(
        "Ошибка",
        `Автоматизированный перевод с '${variables.fromLocale}' на '${variables.toLocale}' не удался: ${error.message}`
      );
    },
  });

  useEffect(() => {
    getAvailableLocales();
  }, [getAvailableLocales]);

  useEffect(() => {
    if (locale) {
      setAutoTranslateFromLocale(locale);
    } else if (availableLocales.length > 0 && !autoTranslateFromLocale) {
      setAutoTranslateFromLocale(availableLocales[0]);
    }
    if (autoTranslateToLocale === locale && locale !== "") {
      setAutoTranslateToLocale("");
    }
  }, [locale, availableLocales]);

  const filteredKeys = Object.keys(translations ?? {}).filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAutoTranslateClick = () => {
    if (!autoTranslateFromLocale) {
      // Use NotificationDialog instead of alert
      showNotification(
        "Внимание",
        "Пожалуйста, выберите исходный язык для автоматического перевода."
      );
      return;
    }
    if (!autoTranslateToLocale) {
      // Use NotificationDialog instead of alert
      showNotification(
        "Внимание",
        "Пожалуйста, выберите целевой язык для автоматического перевода."
      );
      return;
    }
    if (autoTranslateFromLocale === autoTranslateToLocale) {
      // Use NotificationDialog instead of alert
      showNotification(
        "Внимание",
        "Исходный и целевой языки не могут совпадать."
      );
      return;
    }
    if (!userId) {
      // Use NotificationDialog instead of alert
      showNotification(
        "Ошибка",
        "ID пользователя не найден. Невозможно выполнить автоматический перевод."
      );
      return;
    }
    autoTranslateMutation.mutate({
      fromLocale: autoTranslateFromLocale,
      toLocale: autoTranslateToLocale,
      userId,
    });
  };

  const isAutoTranslateDisabled =
    !autoTranslateFromLocale ||
    !autoTranslateToLocale ||
    autoTranslateFromLocale === autoTranslateToLocale ||
    !userId ||
    autoTranslateMutation.isPending;

  const autoTranslateTooltip = isAutoTranslateDisabled
    ? autoTranslateMutation.isPending
      ? "Идет автоматический перевод..."
      : !autoTranslateFromLocale || !autoTranslateToLocale
        ? "Выберите исходный и целевой языки"
        : autoTranslateFromLocale === autoTranslateToLocale
          ? "Исходный и целевой языки должны отличаться"
          : !userId
            ? "ID пользователя не найден"
            : "Запустить автоматический перевод"
    : `Перевести существующие ключи с '${autoTranslateFromLocale}' на '${autoTranslateToLocale}' автоматически`;

  return (
    <ResizablePanel
      elevation={3}
      ref={panelRef}
      sx={{
        height: isExpended ? `${100}vw` : `${panelHeight}px`,
        maxHeight: isExpended ? "100vh" : "80vh",
      }}
    >
      <Box
        display="flex"
        justifyContent="right"
        sx={{ position: "relative", width: "100%" }}
      >
        {isExpended ? null : <ResizeHandle onMouseDown={handleMouseDown} />}
        <Typography
          variant="h1"
          fontSize={26}
          letterSpacing={1}
          fontWeight={400}
          sx={{
            color: "#eebebe",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          Purrfect Locales
        </Typography>

        {/* <ThemeToggle /> */}
        <Box
          sx={{ marginLeft: "auto", padding: "1px" }}
          display="flex"
          alignItems="center"
        >
          <ThemeSwitcherPopover />
          <IconButton
            sx={{ scale: 0.8 }}
            color="default"
            onClick={() => setIsExpended((prev) => !prev)}
            size="small"
            title={isExpended ? "Свернуть панель" : "Развернуть панель"} // Updated title
          >
            {isExpended ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
          <IconButton
            sx={{ scale: 0.8 }}
            color="default"
            onClick={() => setIsPanelVisible(false)}
            size="small"
            title="Закрыть панель"
          >
            <CloseIcon sx={{ fill: "tomato" }} />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          height: "100%",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <PanelHeader
          isHighlightingEnabled={isHighlightingEnabled}
          setHighlightingEnabled={setHighlightingEnabled}
          setIsPanelVisible={setIsPanelVisible}
          locale={locale}
          setLocale={setLocale}
          availableLocales={availableLocales}
          autoTranslateFromLocale={autoTranslateFromLocale}
          setAutoTranslateFromLocale={setAutoTranslateFromLocale}
          autoTranslateToLocale={autoTranslateToLocale}
          setAutoTranslateToLocale={setAutoTranslateToLocale}
          selectedTranslationModel={selectedTranslationModel}
          setSelectedTranslationModel={setSelectedTranslationModel}
          handleAutoTranslateClick={handleAutoTranslateClick}
          isAutoTranslateDisabled={isAutoTranslateDisabled}
          autoTranslateTooltip={autoTranslateTooltip}
          autoTranslateMutation={autoTranslateMutation}
        />

        <Box
          sx={{
            display: "flex",
            flex: 1,
            gap: 2,
            overflow: "hidden",
            p: 2,
            minHeight: 150,
          }}
        >
          <KeysListPanel
            locale={locale}
            filteredKeys={filteredKeys}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedKey={selectedKey}
            isLoadingTranslations={isLoadingTranslations}
            handleSelectKey={handleSelectKey}
          />

          <EditorPanel
            selectedKey={selectedKey}
            isLoadingTranslations={isLoadingTranslations}
            handleSaveChanges={handleSaveChanges}
            autoTranslateMutation={autoTranslateMutation}
          />
        </Box>
      </Box>

      <NotificationDialog
        open={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        onClose={handleCloseDialog}
      />
    </ResizablePanel>
  );
};
