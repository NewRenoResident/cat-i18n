import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Typography,
  Alert,
  Box,
  Divider,
} from "@mui/material";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { VersionInfo } from "@cat-i18n/shared";
import { useGetVersionHistory } from "../api/use-get-version-history";

interface VersionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  selectedKey: string | null;
}

const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const VersionHistoryDialog = ({
  open,
  onClose,
  selectedKey,
}: VersionHistoryDialogProps) => {
  const { locale } = useTransFlow();

  const queryParams =
    selectedKey && locale ? { key: selectedKey, locale } : null;

  const { data, isLoading, isError, error } = useGetVersionHistory(
    queryParams!,
    { enabled: open && !!queryParams }
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        История версий для ключа: "{selectedKey || "N/A"}" ({locale})
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Не удалось загрузить историю:
            {error?.message || "Неизвестная ошибка"}
          </Alert>
        )}
        {!isLoading && !isError && (!data || data.length === 0) && (
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ my: 4 }}
          >
            История версий для этого ключа отсутствует.
          </Typography>
        )}
        {!isLoading && !isError && data && data.length > 0 && (
          <List dense>
            {data
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((version: VersionInfo, index: number) => (
                <React.Fragment key={version.timestamp}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {version.value}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {`Изменил: ${version.userId || "N/A"} | Время: ${formatTimestamp(version.timestamp)}`}
                            {version.tag && ` | Тег: ${version.tag}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < data.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};
