import { useState, useEffect } from "react";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { useTranslatorUI } from "../context/TranslatorUIContext";
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
} from "@mui/material";

import { KeysList } from "./KeysList";
import { useResizablePanel } from "./useResizablePanel";
import { useTranslationAPI } from "./useTranslationAPI";
import { ResizablePanel } from "./ResizablePanel";
import { ResizeHandle } from "./ResizeHandle";
import { TranslationEditor } from "./TranslationEditor";
import { AddLocale } from "../features/add-locale/ui/addLocale";

export const TranslatorPanel = () => {
  const { locale, setLocale, getAvailableLocales } = useTransFlow();
  const { isHighlightingEnabled, setHighlightingEnabled, apiUrl } =
    useTranslatorUI();
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);
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
    getAvailableLocales().then(setAvailableLocales);
  }, [getAvailableLocales]);

  const filteredKeys = Object.keys(translations).filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ResizablePanel
      elevation={3}
      ref={panelRef}
      sx={{ height: `${panelHeight}px`, overflow: "auto" }}
    >
      <ResizeHandle onMouseDown={handleMouseDown} />
      <Typography variant="h6" gutterBottom>
        Translator Panel
      </Typography>
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
      <FormControl
        variant="outlined"
        size="small"
        sx={{ mb: 2, minWidth: 120 }}
      >
        <InputLabel>Locale</InputLabel>
        <Box display="flex" padding="0 16px" gap={4}>
          <Select
            sx={{ flexGrow: 1 }}
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
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", flex: 1, gap: 2, overflow: "hidden" }}>
        <Paper sx={{ width: "40%", p: 2, overflow: "hidden" }} elevation={1}>
          <Typography variant="subtitle1" gutterBottom>
            Keys ({filteredKeys.length})
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
          <KeysList
            filteredKeys={filteredKeys}
            selectedKey={selectedKey}
            isLoading={isLoading}
            onSelectKey={handleSelectKey}
          />
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }} elevation={1}>
          <TranslationEditor
            selectedKey={selectedKey}
            editValue={editValue}
            isLoading={isLoading}
            onEditValueChange={setEditValue}
            onSaveChanges={handleSaveChanges}
          />
        </Paper>
      </Box>
    </ResizablePanel>
  );
};
