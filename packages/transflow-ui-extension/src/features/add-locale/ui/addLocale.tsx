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

import { addLocale } from "../api/locales.api.ts";

interface IAddLocale {
  api?: string; // API endpoint for adding locales
  onLocaleAdded?: () => void; // Callback when locale is successfully added
}

export const AddLocale = ({ onLocaleAdded }: IAddLocale) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nativeName, setNativeName] = useState("");

  // Form validation errors
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");
  const [nativeNameError, setNativeNameError] = useState("");

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
    setError(null);
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

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addLocale(api, code, name, nativeName);

      if (result) {
        setSuccess(true);
        resetForm();
        handleClose();
        if (onLocaleAdded) {
          onLocaleAdded();
        }
      } else {
        setError("Failed to add locale. Please try again.");
      }
    } catch (err) {
      setError(
        "An error occurred: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsSubmitting(false);
    }
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
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
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Locale"}
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
