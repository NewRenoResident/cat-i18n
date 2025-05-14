import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { KeysList } from "../../../components/KeysList";
import { AddLocale } from "../../add-locale/ui/addLocale";
import { AddNewKey } from "../../add-new-key/add-new-key";
import { RemoveLocale } from "../../remove-locale/remove-locale";
import { UpdateLocale } from "../../update-locale/update-locale";
import React from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TranslateIcon from "@mui/icons-material/Translate";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";

interface PanelHeaderProps {
  isHighlightingEnabled: boolean;
  setHighlightingEnabled: (enabled: boolean) => void;
  setIsPanelVisible: (visible: boolean) => void;
  locale: string;
  setLocale: (locale: string) => void;
  availableLocales: string[];
  autoTranslateFromLocale: string;
  setAutoTranslateFromLocale: (locale: string) => void;
  autoTranslateToLocale: string;
  setAutoTranslateToLocale: (locale: string) => void;
  selectedTranslationModel: string;
  setSelectedTranslationModel: (model: string) => void;
  handleAutoTranslateClick: () => void;
  isAutoTranslateDisabled: boolean;
  autoTranslateTooltip: string;
  autoTranslateMutation: {
    isPending: boolean;
  };
}

export const PanelHeader = ({
  isHighlightingEnabled,
  setHighlightingEnabled,
  setIsPanelVisible,
  locale,
  setLocale,
  availableLocales,
  autoTranslateFromLocale,
  setAutoTranslateFromLocale,
  autoTranslateToLocale,
  setAutoTranslateToLocale,
  selectedTranslationModel,
  setSelectedTranslationModel,
  handleAutoTranslateClick,
  isAutoTranslateDisabled,
  autoTranslateTooltip,
  autoTranslateMutation,
}: PanelHeaderProps) => (
  <Box
    component={Paper}
    elevation={0}
    square
    sx={{
      paddingX: 2,
      paddingY: 1,
      flexShrink: 0,
      borderBottom: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
    }}
  >
    <Grid
      container
      spacing={2}
      alignItems="center"
      justifyContent="space-between"
    >
      <Grid size={{ xs: 12, sm: "auto" }}>
        <Box display="flex" gap={1} alignItems="center">
          <TranslateIcon color="primary" />
          <Typography variant="h6" fontWeight={500} noWrap>
            Интерфейс переводов
          </Typography>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, sm: "auto" }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent={{ xs: "flex-start", sm: "center" }}
          gap={1}
          flexWrap="wrap"
        >
          <RemoveLocale />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
            <InputLabel id="view-locale-label">Язык</InputLabel>
            <Select
              labelId="view-locale-label"
              value={locale || ""}
              onChange={(e) => setLocale(e.target.value)}
              label="Язык"
            >
              {availableLocales.map((loc) => (
                <MenuItem key={`view-${loc}`} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <UpdateLocale locale={locale} />
          <AddLocale />
          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 1, display: { xs: "none", md: "block" } }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
            <InputLabel id="auto-from-locale-label">Источник (Авто)</InputLabel>
            <Select
              labelId="auto-from-locale-label"
              value={autoTranslateFromLocale}
              onChange={(e) => setAutoTranslateFromLocale(e.target.value)}
              label="Источник (Авто)"
            >
              {availableLocales.map((loc) => (
                <MenuItem key={`auto-from-${loc}`} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ArrowForwardIcon fontSize="small" color="action" sx={{ mx: -0.5 }} />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 90 }}>
            <InputLabel id="auto-to-locale-label">Цель (Авто)</InputLabel>
            <Select
              labelId="auto-to-locale-label"
              value={autoTranslateToLocale}
              onChange={(e) => setAutoTranslateToLocale(e.target.value)}
              label="Цель (Авто)"
            >
              {availableLocales
                .filter((loc) => loc !== autoTranslateFromLocale)
                .map((loc) => (
                  <MenuItem key={`auto-to-${loc}`} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="model-type-label">Тип модели</InputLabel>
            <Select
              labelId="model-type-label"
              value={selectedTranslationModel}
              onChange={(e) => setSelectedTranslationModel(e.target.value)}
              label="Тип модели"
              startAdornment={
                <ModelTrainingIcon
                  fontSize="small"
                  sx={{ mr: 0.5, color: "action.active" }}
                />
              }
            >
              <MenuItem value="deepseek-chat">Deepseek chat</MenuItem>
              <MenuItem value="claude-3.7">Сlaude 3.7</MenuItem>
              <MenuItem value="gpt-4.1">Gpt 4.1</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={autoTranslateTooltip}>
            <span>
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={
                  autoTranslateMutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                onClick={handleAutoTranslateClick}
                disabled={isAutoTranslateDisabled}
                sx={{ minWidth: "auto", px: 1.5 }}
              >
                {autoTranslateMutation.isPending ? "Перевод..." : "Авто"}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, sm: "auto" }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          gap={1}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={isHighlightingEnabled}
                onChange={(e) => setHighlightingEnabled(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                Подсветка
              </Typography>
            }
            sx={{ mr: 1 }}
            title="Подсветить элементы на странице"
          />
        </Box>
      </Grid>
    </Grid>
  </Box>
);
