import { useTransFlow } from "@cat-i18n/scottish-fold";
import {
  Box,
  Button,
  CircularProgress, // Import CircularProgress for loading state
  Divider, // Import Button
  List, // Import List components
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react"; // Import useState
import { useTranslationStore } from "../../../api/useTranslationApiStore";
import { TranslationEditor } from "../../translation-editor/translation-editor";
import { useGetTagsByKeyAndLocale } from "../../tags/api/use-get-tags-by-key-and-locale";
export const EditorPanel = ({
  isLoadingTranslations,
  handleSaveChanges,
  autoTranslateMutation,
}) => {
  const { selectedKey } = useTranslationStore();
  const { locale } = useTransFlow();

  const [showVersions, setShowVersions] = useState(false);

  const queryParams = { key: selectedKey as string, locale };

  const {
    data,
    isLoading: isLoadingVersions,
    isError: isErrorVersions,
    error: errorVersions,
  } = useGetTagsByKeyAndLocale(queryParams, {
    enabled: !!selectedKey,
  });

  const versionHistory = data?.versions;

  const toggleVersions = () => {
    setShowVersions((prev) => !prev);
  };

  // Helper to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {selectedKey ? (
        <Paper
          sx={{
            flex: 1, // Takes available space
            p: 1.5,
            overflow: "hidden", // Important: Hide overflow here initially
            display: "flex",
            flexDirection: "column",
          }}
          elevation={1}
        >
          {/* Translation Editor takes available space */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", marginBottom: 1.5 }}>
            {" "}
            {/* Make editor scrollable if needed */}
            <TranslationEditor
              tags={data?.tags}
              selectedKey={selectedKey}
              isLoading={
                isLoadingTranslations || autoTranslateMutation.isPending
              }
              onSaveChanges={handleSaveChanges}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Button to toggle versions */}
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={toggleVersions}
              disabled={isLoadingTranslations} // Disable if main content is loading
            >
              {showVersions
                ? "Скрыть историю версий"
                : "Показать историю версий"}
            </Button>
          </Box>

          {/* Conditional rendering for Version History */}
          {showVersions && (
            <Box
              sx={{
                // Allow this section to take some space but be scrollable
                flexShrink: 0, // Prevent shrinking when other content grows
                mt: 1,
                borderTop: "1px solid", // Visual separation
                borderColor: "divider",
                overflowY: "auto", // Make the list scrollable
                maxHeight: "300px", // Limit height, adjust as needed
              }}
            >
              {isLoadingVersions && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 2,
                  }}
                >
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 1 }} variant="body2">
                    Загрузка истории...
                  </Typography>
                </Box>
              )}
              {isErrorVersions && (
                <Typography color="error" sx={{ p: 2 }}>
                  Ошибка загрузки истории:{" "}
                  {errorVersions?.message || "Неизвестная ошибка"}
                </Typography>
              )}
              {!isLoadingVersions && !isErrorVersions && (
                <>
                  {versionHistory && versionHistory.length > 0 ? (
                    <List dense sx={{ pt: 0 }}>
                      {" "}
                      {/* `dense` for smaller items, pt:0 removes top padding */}
                      {versionHistory
                        .slice() // Create a copy to avoid mutating original
                        .sort((a, b) => b.timestamp - a.timestamp) // Sort newest first
                        .map((version, index) => (
                          <ListItem
                            key={`${version.key}-${version.timestamp}-${index}`} // More robust key
                            divider={index < versionHistory.length - 1} // Add divider between items
                            sx={{ alignItems: "flex-start" }} // Align items top
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{ wordBreak: "break-word" }} // Prevent long values overflowing
                                >
                                  {version.value || <i>(пустое значение)</i>}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  component="span" // Use span to allow block display
                                  sx={{ display: "block", mt: 0.5 }} // Stack secondary info
                                >
                                  {`${formatTimestamp(version.timestamp)} by ${version.userId}`}
                                  {version.tag && ` [${version.tag}]`}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Typography
                      sx={{ p: 2, textAlign: "center" }}
                      color="text.secondary"
                    >
                      История версий не найдена.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </Paper>
      ) : (
        // Placeholder when no key is selected (unchanged)
        <Paper
          sx={{
            flex: 1,
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px dashed",
            borderColor: "grey.400",
            backgroundColor: "transparent",
          }}
          elevation={0}
          variant="outlined"
        >
          <Typography color="text.secondary">
            {isLoadingTranslations
              ? "Загрузка ключей..."
              : "Выберите ключ для редактирования"}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
