import { useState, useEffect } from "react";

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
import React from "react";

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
    isLoading,
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
          gridTemplateColumns="1fr auto 1fr"
          paddingX={1}
          alignItems="center"
          gap={4}
          flexShrink={0}
        >
          <Typography
            variant="h4"
            fontWeight={400}
            gutterBottom
            sx={{
              background: "linear-gradient(45deg, #ea999c 0%, #f4b8e4 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              marginRight: "auto",
            }}
          >
            Translator Panel
          </Typography>

          <FormControl variant="outlined" size="small">
            <InputLabel>Locale</InputLabel>
            <Box display="flex" gap={4}>
              <Select
                sx={{ flexGrow: 1, maxWidth: 80 }}
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                label="Locale"
              >
                {availableLocales.map((loc, index) => {
                  return (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  );
                })}
              </Select>
              <AddLocale />
            </Box>
          </FormControl>

          <Box display="flex" justifyContent="flex-end">
            <IconButton
              color="error"
              onClick={() => {
                setIsPanelVisible(false);
              }}
              sx={{ alignSelf: "start" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={isHighlightingEnabled}
              onChange={(e) => setHighlightingEnabled(e.target.checked)}
              color="primary"
            />
          }
          label="Highlight Translatable Elements"
        />

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            flex: 1,
            gap: 2,
            overflow: "hidden",
            minHeight: 140,
          }}
        >
          <Paper sx={{ width: "40%", p: 2, overflow: "hidden" }} elevation={1}>
            <Typography variant="subtitle1" gutterBottom>
              Keys: {filteredKeys.length}
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />

            {!!filteredKeys.length && (
              <KeysList
                locale={locale}
                filteredKeys={filteredKeys}
                selectedKey={selectedKey}
                isLoading={isLoading}
                onSelectKey={handleSelectKey}
              />
            )}
          </Paper>

          {selectedKey && (
            <Paper sx={{ flex: 1, p: 2 }} elevation={1}>
              <TranslationEditor
                selectedKey={selectedKey}
                editValue={editValue}
                isLoading={isLoading}
                onEditValueChange={setEditValue}
                onSaveChanges={handleSaveChanges}
              />
            </Paper>
          )}
        </Box>
      </Box>
    </ResizablePanel>
  );
};
