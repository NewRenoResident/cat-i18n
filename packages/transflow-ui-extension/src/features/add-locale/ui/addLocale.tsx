import {
  IconButton,
  Popover,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";
import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";

import { useAddLocaleMutation } from "../api/locales.api";
import { useTranslatorUI } from "../../../context/TranslatorUIContext";

interface IAddLocale {
  onLocaleAdded?: () => void;
}

export const AddLocale = ({ onLocaleAdded }: IAddLocale) => {
  const { apiUrl } = useTranslatorUI();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [success, setSuccess] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nativeName, setNativeName] = useState("");

  // Form validation errors
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");
  const [nativeNameError, setNativeNameError] = useState("");

  // Используем React Query для мутации
  const addLocaleMutation = useAddLocaleMutation(apiUrl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Reset form when opening
    resetForm();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setNativeName("");
    setCodeError("");
    setNameError("");
    setNativeNameError("");
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate code (e.g., 'en', 'fr', 'es')
    if (!code) {
      setCodeError("Locale code is required");
      isValid = false;
    } else if (!/^[a-z]{2,3}(-[A-Z]{2,3})?$/.test(code)) {
      setCodeError("Invalid locale format (e.g., 'en', 'fr-FR')");
      isValid = false;
    } else {
      setCodeError("");
    }

    // Validate name
    if (!name) {
      setNameError("Language name is required");
      isValid = false;
    } else {
      setNameError("");
    }

    // Validate native name
    if (!nativeName) {
      setNativeNameError("Native name is required");
      isValid = false;
    } else {
      setNativeNameError("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    addLocaleMutation.mutate(
      { code, name, nativeName },
      {
        onSuccess: () => {
          setSuccess(true);
          resetForm();
          handleClose();
          if (onLocaleAdded) {
            onLocaleAdded();
          }
        },
      }
    );
  };

  const open = Boolean(anchorEl);
  const id = open ? "add-locale-popover" : undefined;

  return (
    <>
      <IconButton onClick={handleClick} aria-label="Add new locale">
        <AddIcon />
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, width: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New Locale
          </Typography>

          {addLocaleMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addLocaleMutation.error?.message ||
                "Failed to add locale. Please try again."}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Locale Code"
              placeholder="e.g. en, fr-FR"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={!!codeError}
              helperText={codeError || "Format: xx or xx-XX"}
              fullWidth
              required
              size="small"
            />

            <TextField
              label="Language Name"
              placeholder="e.g. English"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              required
              size="small"
            />

            <TextField
              label="Native Name"
              placeholder="e.g. English"
              value={nativeName}
              onChange={(e) => setNativeName(e.target.value)}
              error={!!nativeNameError}
              helperText={nativeNameError}
              fullWidth
              required
              size="small"
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 1,
              }}
            >
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={addLocaleMutation.isPending}
              >
                {addLocaleMutation.isPending ? "Adding..." : "Add Locale"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Popover>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Locale added successfully"
      />
    </>
  );
};
