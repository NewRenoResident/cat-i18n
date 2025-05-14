import {
  Box,
  CircularProgress,
  Paper,
  TextField,
  Typography,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Switch,
  FormControlLabel,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { KeysList } from "../../../components/KeysList";
import { AddNewKey } from "../../add-new-key/add-new-key";
import { useGetTagsByLocale } from "../../tags/api/use-get-tags-by-locale";
import { useSearchTranslationsByTags } from "../../tags/api/use-search-translations-by-tags";

export const KeysListPanel = ({
  locale,
  filteredKeys,
  searchTerm,
  setSearchTerm,
  selectedKey,
  isLoadingTranslations: isLoadingTranslationsProp,
  handleSelectKey,
}) => {
  const searchTranslationsByTags = useSearchTranslationsByTags();
  const [tagFilteredKeys, setTagFilteredKeys] = useState(filteredKeys);
  const [selectedTags, setSelectedTags] = useState([]);
  const [matchAllTags, setMatchAllTags] = useState(true); // <-- State for matchAll toggle

  const { data: availableTags = [], isLoading: isLoadingTags } =
    useGetTagsByLocale({ locale });

  // Effect 1: Trigger API call when selectedTags, locale, or matchAllTags changes
  useEffect(() => {
    if (selectedTags.length > 0) {
      searchTranslationsByTags.mutate({
        locale: locale,
        tags: selectedTags,
        matchAll: matchAllTags, // <-- Use state here
      });
    }
  }, [selectedTags, locale, matchAllTags, searchTranslationsByTags.mutate]); // <-- Added matchAllTags

  // Effect 2: Update tagFilteredKeys based on API response or if tags are cleared
  useEffect(() => {
    if (selectedTags.length > 0) {
      if (searchTranslationsByTags.data) {
        setTagFilteredKeys(Object.keys(searchTranslationsByTags.data));
      } else if (searchTranslationsByTags.isPending) {
        setTagFilteredKeys([]);
      } else {
        // Potentially an error or no results from tag search
        setTagFilteredKeys([]);
      }
    } else {
      setTagFilteredKeys(filteredKeys);
      // If tags are cleared, reset the mutation state if desired,
      // though react-query usually handles this well.
      // searchTranslationsByTags.reset(); // Optional: if you want to clear previous data/error
    }
  }, [
    selectedTags,
    searchTranslationsByTags.data,
    searchTranslationsByTags.isPending,
    filteredKeys,
    // searchTranslationsByTags.reset // If using reset above
  ]);

  const handleTagChange = (event) => {
    const { value } = event.target;
    setSelectedTags(typeof value === "string" ? value.split(",") : value);
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleMatchAllChange = (event) => {
    setMatchAllTags(event.target.checked);
  };

  const isLoadingEffective =
    isLoadingTranslationsProp ||
    (selectedTags.length > 0 && searchTranslationsByTags.isPending);

  return (
    <Paper
      sx={{
        width: { xs: "100%", sm: "35%", md: "40%" },
        p: 1.5,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
      elevation={1}
    >
      <Typography
        variant="overline"
        display="block"
        gutterBottom
        sx={{ px: 1, flexShrink: 0 }}
      >
        Ключи ({locale}): {tagFilteredKeys.length}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Поиск ключей..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 1, px: 1, flexShrink: 0 }}
      />

      <Box sx={{ px: 1, flexShrink: 0 }}>
        {" "}
        {/* Wrapper for tag filter and toggle */}
        <FormControl sx={{ mb: 1 }} size="small" fullWidth>
          <InputLabel id="tag-select-label">Фильтр по тегам</InputLabel>
          <Select
            labelId="tag-select-label"
            id="tag-select"
            multiple
            value={selectedTags}
            onChange={handleTagChange}
            input={<OutlinedInput label="Фильтр по тегам" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            )}
            disabled={isLoadingTags}
          >
            {isLoadingTags ? (
              <MenuItem disabled>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Загрузка тегов...</Typography>
                </Box>
              </MenuItem>
            ) : availableTags.length ? (
              availableTags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2">Теги не найдены</Typography>
              </MenuItem>
            )}
          </Select>
        </FormControl>
        {/* Match All Toggle */}
        {selectedTags.length > 0 && ( // Only show toggle if tags are selected
          <FormControlLabel
            control={
              <Switch
                checked={matchAllTags}
                onChange={handleMatchAllChange}
                size="small"
              />
            }
            label="Совпадение по всем тегам (И)"
            sx={{ mb: 1, display: "flex", justifyContent: "flex-start" }}
          />
        )}
      </Box>

      {selectedTags.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 1, mb: 1.5, flexShrink: 0, flexWrap: "wrap", gap: 0.5 }}
        >
          {selectedTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => {
                setSelectedTags((prev) => prev.filter((t) => t !== tag));
              }}
            />
          ))}
          <Chip
            label="Очистить"
            size="small"
            variant="outlined"
            onClick={handleClearTags}
          />
        </Stack>
      )}

      <Box sx={{ px: 1, mb: 1.5, flexShrink: 0 }}>
        <AddNewKey locale={locale} />
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5, pl: 1 }}>
        {isLoadingEffective ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : tagFilteredKeys.length > 0 ? (
          <KeysList
            locale={locale}
            filteredKeys={tagFilteredKeys}
            selectedKey={selectedKey}
            isLoading={isLoadingEffective}
            onSelectKey={handleSelectKey}
          />
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            {searchTerm || selectedTags.length
              ? "Нет ключей, соответствующих поиску или выбранным тегам."
              : "Ключи не найдены или не загружены."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
