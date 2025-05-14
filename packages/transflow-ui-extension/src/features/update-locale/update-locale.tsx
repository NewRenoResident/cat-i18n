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
import React, { useState, useEffect } from "react";
import EditIcon from "@mui/icons-material/Edit"; // Changed icon
import { useTranslatorUI } from "../../context/TranslatorUIContext";
import { useUpdateMutation } from "./api/update-locale.api";

interface IUpdateLocale {
  locale: string;
  onLocaleUpdated?: () => void;
}

export const UpdateLocale = ({ locale, onLocaleUpdated }: IUpdateLocale) => {
  const { apiUrl } = useTranslatorUI(); // Assuming it might be needed by the mutation hook
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const [success, setSuccess] = useState(false);

  // Form state - initialized empty, will be set when popover opens
  const [name, setName] = useState("");
  const [nativeName, setNativeName] = useState("");

  // Form validation errors
  const [nameError, setNameError] = useState("");
  const [nativeNameError, setNativeNameError] = useState("");

  // Use React Query mutation for updating
  const updateLocaleMutation = useUpdateMutation();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    // Pre-fill form with existing locale data when opening
    // Note: 'code' comes directly from props and is read-only
    // Reset errors
    setNameError("");
    setNativeNameError("");
    // Reset mutation state if it was previously in error
    updateLocaleMutation.reset();
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Don't reset form here, only on open or success
  };

  // No need for resetForm function as it's handled in handleClick and onSuccess

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate name (code is read-only, no validation needed here)
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

    // Call the mutation hook
    // Pass the identifier (locale.code) and the data to update
    updateLocaleMutation.mutate(
      {
        code: locale, // Identifier
        name: name, // Updated value
        nativeName: nativeName, // Updated value
      },
      {
        onSuccess: () => {
          setSuccess(true);
          // No need to reset form fields here as they hold the new values
          handleClose();
          if (onLocaleUpdated) {
            onLocaleUpdated(); // Trigger callback
          }
        },
        // onError is handled by checking updateLocaleMutation.isError below
      }
    );
  };

  const open = Boolean(anchorEl);
  const id = open ? `update-locale-popover-${locale}` : undefined; // Unique ID

  return (
    <>
      {/* Use an Edit Icon */}
      <IconButton
        onClick={handleClick}
        aria-label={`Edit locale ${locale}`}
        size="small" // Optional: make icon button smaller
      >
        <EditIcon fontSize="small" />
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, width: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Update Locale ({locale})
          </Typography>

          {updateLocaleMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {/* Provide a more specific error message if possible */}
              {(updateLocaleMutation.error as any)?.message || // Type assertion might be needed
                "Failed to update locale. Please try again."}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* Code field - Read Only */}
            <TextField
              label="Locale Code"
              value={locale} // Display from props
              fullWidth
              required
              size="small"
              InputProps={{
                readOnly: true, // Make it read-only
              }}
              disabled // Visually indicate it's not editable
              helperText="Locale code cannot be changed."
            />

            {/* Name field */}
            <TextField
              label="Language Name"
              placeholder="e.g. English"
              value={name} // Controlled component state
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              required
              size="small"
              autoFocus // Focus the first editable field
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
                disabled={updateLocaleMutation.isPending}
              >
                {updateLocaleMutation.isPending
                  ? "Updating..."
                  : "Update Locale"}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Popover>

      {/* Success message */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Locale updated successfully" // Updated message
      />
    </>
  );
};
