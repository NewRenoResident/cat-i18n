import React from "react";
import { Typography, Button, TextareaAutosize } from "@mui/material";

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
    <>
      <Typography variant="subtitle1" gutterBottom>
        Edit Translation
      </Typography>
      {selectedKey ? (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Key:</strong> {selectedKey}
          </Typography>
          <TextareaAutosize
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            minRows={5}
            style={{
              width: "100%",
              marginBottom: "16px",
              padding: "8px",
              fontFamily: "inherit",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={onSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </>
      ) : (
        <Typography variant="body2" color="textSecondary">
          Select a key from the list to edit.
        </Typography>
      )}
    </>
  );
};
