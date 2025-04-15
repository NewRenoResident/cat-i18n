import React from "react";
import {
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  styled,
} from "@mui/material";

// Custom styled TextField to preserve whitespace and formatting
const FormattingTextField = styled(TextField)({
  "& .MuiInputBase-input": {
    fontFamily: "inherit",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    lineHeight: 1.5,
  },
  "& .MuiOutlinedInput-root": {
    transition: "all 0.2s",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#f4b8e4",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#ca9ee6",
      borderWidth: 2,
    },
  },
});

interface TranslationEditorProps {
  selectedKey: string | null;
  editValue: string;
  isLoading: boolean;
  onEditValueChange: (value: string) => void;
  onSaveChanges: () => void;
}

export const TranslationEditor = ({
  selectedKey,
  editValue,
  isLoading,
  onEditValueChange,
  onSaveChanges,
}: TranslationEditorProps) => {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom fontWeight="medium" color="primary">
        Edit Translation
      </Typography>

      {selectedKey ? (
        <>
          <Box
            sx={{ mb: 2, p: 1.5, bgcolor: "rgba(0,0,0,0.04)", borderRadius: 1 }}
          >
            <Typography variant="body2">
              <strong>Key:</strong> {selectedKey}
            </Typography>
          </Box>

          <FormattingTextField
            fullWidth
            multiline
            variant="outlined"
            minRows={5}
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            sx={{
              mb: 2.5,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#414559",
              },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={onSaveChanges}
              disabled={isLoading}
              sx={{
                px: 3,
                borderRadius: 1.5,
              }}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            bgcolor: "rgba(0,0,0,0.03)",
            borderRadius: 1,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a key from the list to edit.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
