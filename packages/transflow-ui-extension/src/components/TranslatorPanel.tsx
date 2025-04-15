import { useState, useEffect } from "react";
import React from "react";

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
  Button,
} from "@mui/material";

import { KeysList } from "./KeysList";
import { useResizablePanel } from "./useResizablePanel";
import { useTranslationAPI } from "./useTranslationAPI";
import { ResizablePanel } from "./ResizablePanel";
import { ResizeHandle } from "./ResizeHandle";
import { AddLocale } from "../features/add-locale/ui/addLocale";
import { RemoveLocale } from "../features/remove-locale/remove-locale";
import { UpdateLocale } from "../features/update-locale/update-locale";
import { TranslationEditor } from "../features/translation-editor/translation-editor";
import { AddNewKey } from "../features/add-new-key/add-new-key";

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

  const {
    translations,
    selectedKey,
    editValue,
    isLoading: isLoadingTranslations,
    setEditValue,
    handleSelectKey,
    handleSaveChanges,
  } = useTranslationAPI(apiUrl, locale);

  useEffect(() => {
    getAvailableLocales();
  }, [getAvailableLocales]);

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
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns="auto 1fr auto"
          paddingX={2}
          paddingY={1}
          alignItems="center"
          gap={2}
          flexShrink={0}
          borderBottom={1}
          borderColor="divider"
        >
          <Typography variant="h6" fontWeight={500}>
            Translator Panel
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1.5}
          >
            <RemoveLocale />

            <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Locale</InputLabel>
              <Select
                value={locale || ""}
                onChange={(e) => setLocale(e.target.value)}
                label="Locale"
              >
                {availableLocales.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <UpdateLocale locale={locale} />
            <AddLocale />
          </Box>

          <Box display="flex" justifyContent="flex-end">
            <IconButton
              color="inherit"
              onClick={() => setIsPanelVisible(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Box px={2} pt={1} flexShrink={0}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isHighlightingEnabled}
                onChange={(e) => setHighlightingEnabled(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                Highlight Translatable Elements
              </Typography>
            }
          />
        </Box>
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
              <AddNewKey locale={locale} />
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
