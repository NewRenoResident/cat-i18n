import { useState, useEffect } from "react";
import React from "react"; // Ensure React is imported

import { useTransFlow } from "@cat-i18n/scottish-fold";
import { useTranslatorUI } from "../context/TranslatorUIContext";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Select,
  MenuItem,
  TextField,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";

import { KeysList } from "./KeysList";
import { useResizablePanel } from "./useResizablePanel";
import { useTranslationAPI } from "./useTranslationAPI";
import { ResizablePanel } from "./ResizablePanel";
import { ResizeHandle } from "./ResizeHandle";
import { TranslationEditor } from "./TranslationEditor";
import { AddLocale } from "../features/add-locale/ui/addLocale";
import { RemoveLocale } from "../features/remove-locale/remove-locale";

export const TranslatorPanel = () => {
  const { locale, setLocale, getAvailableLocales, availableLocales } =
    useTransFlow();

  const {
    isHighlightingEnabled,
    setHighlightingEnabled,
    apiUrl,
    setIsPanelVisible,
  } = useTranslatorUI();

  const [searchTerm, setSearchTerm] = useState("");

  const { panelHeight, panelRef, handleMouseDown } = useResizablePanel(300);

  // Assuming useTranslationAPI doesn't fetch the locales list itself
  // If it does, you might need to adjust how locales are fetched/managed
  const {
    translations,
    selectedKey,
    editValue,
    isLoading: isLoadingTranslations, // Renamed to avoid conflict if RemoveLocale isLoading is used here
    setEditValue,
    handleSelectKey,
    handleSaveChanges,
  } = useTranslationAPI(apiUrl, locale);

  useEffect(() => {
    // Fetch available locales when the panel mounts or locale might change
    getAvailableLocales();
  }, [getAvailableLocales]); // Removed locale dependency if getAvailableLocales doesn't need it

  const filteredKeys = Object.keys(translations).filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ResizablePanel
      elevation={3}
      ref={panelRef}
      sx={{ height: `${panelHeight}px` }}
    >
      <ResizeHandle onMouseDown={handleMouseDown} />
      <Box
        sx={{
          height: "100%",
          overflow: "auto", // Keep overflow auto for content scrolling
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* --- Header Row --- */}
        <Box
          display="grid"
          // Use specific widths/fr units for better control if needed
          gridTemplateColumns="auto 1fr auto" // Adjust columns: Title | Controls | Close Button
          paddingX={2} // Increased padding slightly
          paddingY={1}
          alignItems="center"
          gap={2} // Reduced gap slightly
          flexShrink={0}
          borderBottom={1} // Optional: Add a subtle border
          borderColor="divider"
        >
          <Typography
            variant="h6" // Reduced size slightly for compactness
            fontWeight={500} // Adjusted weight
            // Removed gradient for simplicity, uncomment if preferred
            // sx={{
            //   background: "linear-gradient(45deg, #ea999c 0%, #f4b8e4 100%)",
            //   backgroundClip: "text",
            //   WebkitBackgroundClip: "text",
            //   color: "transparent",
            // }}
          >
            Translator Panel
          </Typography>

          {/* Center Column: Locale Controls */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center" // Center the controls in their column
            gap={1.5} // Adjust gap between locale controls
          >
            <RemoveLocale />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
              {" "}
              <InputLabel>Locale</InputLabel>
              <Select
                value={locale || ""} // Handle potentially null/undefined locale
                onChange={(e) => setLocale(e.target.value)}
                label="Locale"
              >
                {availableLocales.map(
                  (
                    loc // Removed index as key is usually enough
                  ) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            <AddLocale />
          </Box>

          {/* Right Column: Close Button */}
          <Box display="flex" justifyContent="flex-end">
            <IconButton
              color="inherit" // Use inherit or default color, error might be too strong
              onClick={() => setIsPanelVisible(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        {/* --- Options Row --- */}
        <Box px={2} pt={1} flexShrink={0}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isHighlightingEnabled}
                onChange={(e) => setHighlightingEnabled(e.target.checked)}
                size="small" // Smaller checkbox
              />
            }
            label={
              <Typography variant="body2">
                Highlight Translatable Elements
              </Typography>
            } // Smaller label
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flex: 1, // Allow this area to grow and fill space
            gap: 2,
            overflow: "hidden", // Prevent content overflow issues
            p: 2, // Padding around the content area
            minHeight: 150, // Ensure minimum height for visibility
          }}
        >
          <Paper
            sx={{
              width: "40%",
              p: 1.5,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            elevation={1}
          >
            <Typography
              variant="overline"
              display="block"
              gutterBottom
              sx={{ px: 1 }}
            >
              Keys: {filteredKeys.length}
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 1.5, px: 1, flexShrink: 0 }}
            />

            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              {filteredKeys.length > 0 ? (
                <KeysList
                  locale={locale}
                  filteredKeys={filteredKeys}
                  selectedKey={selectedKey}
                  isLoading={isLoadingTranslations}
                  onSelectKey={handleSelectKey}
                />
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 1 }}
                >
                  No keys found.
                </Typography>
              )}
            </Box>
          </Paper>

          {selectedKey && (
            <Paper
              sx={{
                flex: 1,
                p: 1.5,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
              elevation={1}
            >
              <TranslationEditor
                selectedKey={selectedKey}
                editValue={editValue}
                isLoading={isLoadingTranslations}
                onEditValueChange={setEditValue}
                onSaveChanges={handleSaveChanges}
              />
            </Paper>
          )}
          {!selectedKey && (
            <Paper
              sx={{
                flex: 1,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              elevation={1}
            >
              <Typography color="text.secondary">
                Select a key to edit
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </ResizablePanel>
  );
};
