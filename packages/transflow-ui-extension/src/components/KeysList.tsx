import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { ScrollableList } from "./ScrollableList";
import { SelectedListItem } from "./SelectedListItem";

interface KeysListProps {
  filteredKeys: string[];
  selectedKey: string | null;
  isLoading: boolean;
  onSelectKey: (key: string) => void;
}

export const KeysList: React.FC<KeysListProps> = ({
  filteredKeys,
  selectedKey,
  isLoading,
  onSelectKey,
}) => {
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
              <ListItem key={key} disablePadding>
                <SelectedListItem onClick={() => onSelectKey(key)}>
                  <ListItemText
                    primary={key}
                    sx={{
                      "& .MuiTypography-root": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        wordBreak: "break-all",
                        title: key,
                      },
                    }}
                  />
                </SelectedListItem>
              </ListItem>
            ) : (
              <ListItem key={key} disablePadding>
                <ListItemButton onClick={() => onSelectKey(key)}>
                  <ListItemText
                    primary={key}
                    sx={{
                      "& .MuiTypography-root": {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        wordBreak: "break-all",
                        title: key,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </ScrollableList>
      )}
    </>
  );
};
