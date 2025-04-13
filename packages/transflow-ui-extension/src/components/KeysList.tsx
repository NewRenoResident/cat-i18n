import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Popover,
  Button,
  Stack,
} from "@mui/material";
import { ScrollableList } from "./ScrollableList";
import { SelectedListItem } from "./SelectedListItem";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface KeysListProps {
  filteredKeys: string[];
  selectedKey: string | null;
  isLoading: boolean;
  onSelectKey: (key: string) => void;
  locale: string;
  onDeleteSuccess?: () => void;
}

const deleteTranslation = async ({
  key,
  locale,
}: {
  key: string;
  locale: string;
}) => {
  const response = await fetch(
    `http://localhost:3000/api/translations/translation?key=${encodeURIComponent(key)}&locale=${encodeURIComponent(locale)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error("Failed to delete translation");
  }

  return response.json();
};

export const KeysList = ({
  filteredKeys,
  selectedKey,
  isLoading,
  onSelectKey,
  locale,
  onDeleteSuccess,
}: KeysListProps) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTranslation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    },
  });

  // State for popover
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const handleDeleteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    key: string
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setKeyToDelete(key);
  };

  const handleDeleteClose = () => {
    setAnchorEl(null);
    setKeyToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (keyToDelete) {
      mutate({ key: keyToDelete, locale });
      handleDeleteClose();
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <ScrollableList dense>
          {filteredKeys.map((key) =>
            key === selectedKey ? (
              <ListItem
                sx={{ paddingLeft: 1, paddingRight: 2, gap: 1 }}
                key={key}
                disablePadding
              >
                <SelectedListItem
                  sx={{ borderRadius: 2, width: "100%" }}
                  onClick={() => onSelectKey(key)}
                >
                  <ListItemText
                    primary={key}
                    sx={{
                      "& .MuiTypography-root": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        wordBreak: "break-all",
                      },
                    }}
                    title={key}
                  />
                </SelectedListItem>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={(e) =>
                    handleDeleteClick(
                      e as React.MouseEvent<HTMLButtonElement>,
                      key
                    )
                  }
                  disabled={isPending && keyToDelete === key}
                >
                  {isPending && keyToDelete === key ? (
                    <CircularProgress size={20} color="error" />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </ListItem>
            ) : (
              <ListItem
                key={key}
                sx={{ paddingLeft: 1, paddingRight: 2, gap: 1 }}
                disablePadding
              >
                <ListItemButton
                  sx={{ borderRadius: 2, width: "100%" }}
                  onClick={() => onSelectKey(key)}
                >
                  <ListItemText
                    primary={key}
                    sx={{
                      "& .MuiTypography-root": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        wordBreak: "break-all",
                      },
                    }}
                    title={key}
                  />
                </ListItemButton>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={(e) =>
                    handleDeleteClick(
                      e as React.MouseEvent<HTMLButtonElement>,
                      key
                    )
                  }
                  disabled={isPending && keyToDelete === key}
                >
                  {isPending && keyToDelete === key ? (
                    <CircularProgress size={20} color="error" />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </ListItem>
            )
          )}
        </ScrollableList>
      )}

      {/* Delete Confirmation Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleDeleteClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Вы уверены, что хотите удалить перевод для ключа "{keyToDelete}"?
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={handleDeleteClose} size="small">
              Отмена
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              size="small"
              disabled={isPending}
            >
              {isPending ? "Удаление..." : "Удалить"}
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};
