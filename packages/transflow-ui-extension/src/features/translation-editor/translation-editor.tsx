import { useState } from "react";
import {
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  styled,
  Checkbox,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { VersionHistoryDialog } from "../history/ui/VersionHistoryDialog";
import { useTranslationAPI } from "../../api/useTranslationAPI";
import React from "react";
import { useAddTags } from "../tags/api/use-add-tags";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { useDeleteTags } from "../tags/api/use-delete-tags";

const FormattingTextField = styled(TextField)({});

interface TranslationEditorProps {
  selectedKey: string | null;
  isLoading: boolean;
  onSaveChanges: () => void;
  tags?: string[];
}

export const TranslationEditor = ({
  selectedKey,
  tags = [],
  isLoading,
  onSaveChanges,
}: TranslationEditorProps) => {
  const { locale } = useTransFlow();

  const {
    mutate: addTags,
    isPending: isAddingTags,
    isError: isAddTagsError,
    error: addTagsError,
  } = useAddTags();
  const { mutate: deleteTags, isPending: isDeletingTag } = useDeleteTags();

  const { translations } = useTranslationAPI();
  const [editValue, setEditValue] = useState("");
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const [tagBeingDeleted, setTagBeingDeleted] = useState<string | null>(null);

  // Состояния для диалога добавления тега
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Состояние для уведомлений
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const handleCloseHistoryDialog = () => {
    setIsHistoryDialogOpen(false);
  };

  const handleOpenTagDialog = () => {
    setIsTagDialogOpen(true);
  };

  const handleCloseTagDialog = () => {
    setIsTagDialogOpen(false);
    setNewTag("");
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddTag = () => {
    if (newTag.trim() && selectedKey) {
      // Разделим теги, если введено несколько через пробел
      const newTags = newTag.trim().split(/\s+/);

      // Добавляем теги через API
      addTags(
        {
          key: selectedKey,
          locale: locale,
          tags: newTags,
        },
        {
          onSuccess: (response) => {
            setSnackbar({
              open: true,
              message: response.data?.message || "Теги успешно добавлены",
              severity: "success",
            });
            tags && tags.push(...newTags);
            handleCloseTagDialog();
          },
          onError: (error) => {
            setSnackbar({
              open: true,
              message:
                error instanceof Error
                  ? error.message
                  : "Ошибка при добавлении тегов",
              severity: "error",
            });
          },
        }
      );
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (selectedKey) {
      setTagBeingDeleted(tagToDelete);

      deleteTags(
        {
          key: selectedKey,
          locale: locale,
          tags: [tagToDelete],
        },
        {
          onSuccess: (response) => {
            setSnackbar({
              open: true,
              message: response?.message || "Тег успешно удален",
              severity: "success",
            });

            // Обновляем локальный массив тегов
            const tagIndex = tags.indexOf(tagToDelete);
            if (tagIndex !== -1) {
              tags.splice(tagIndex, 1);
            }

            setTagBeingDeleted(null);
          },
          onError: (error) => {
            setSnackbar({
              open: true,
              message:
                error instanceof Error
                  ? error.message
                  : "Ошибка при удалении тега",
              severity: "error",
            });
            setTagBeingDeleted(null);
          },
        }
      );
    }
  };

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          fontWeight="medium"
          color="primary"
        >
          Конфигурация
        </Typography>

        {selectedKey ? (
          <>
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                pl: 3,
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 1,
              }}
              display="flex"
              flexDirection="column"
              alignItems="self-start"
            >
              <Typography variant="body2">
                <strong>Ключ:</strong> {selectedKey}
              </Typography>
              <Typography variant="body2" textAlign="start">
                <strong>Текущее значение:</strong> {translations[selectedKey]}
              </Typography>
              <Box display="flex" mt={1}>
                <Typography variant="body2" mr={1}>
                  <strong>Теги:</strong>
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={() => handleDeleteTag(tag)}
                        disabled={tagBeingDeleted === tag}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Нет тегов
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenTagDialog}
                    sx={{ ml: 1, height: 24 }}
                    disabled={isAddingTags}
                  >
                    {isAddingTags ? "Добавление..." : "+ Добавить тег"}
                  </Button>
                </Box>
              </Box>
            </Box>

            <FormattingTextField
              fullWidth
              multiline={isMultiline}
              variant="outlined"
              label="Редактировать значение"
              minRows={5}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              sx={{
                mb: 2.5,
                clear: "both",
              }}
            />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
            >
              <Box display="flex" alignItems="center">
                <Checkbox
                  checked={isMultiline}
                  onChange={(e) => setIsMultiline(e.target.checked)}
                />
                <Typography>Многострочный</Typography>
              </Box>

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
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
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
              Выберите ключ из списка для редактирования.
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={isTagDialogOpen} onClose={handleCloseTagDialog}>
        <DialogTitle>Добавить новый тег</DialogTitle>

        <DialogContent>
          <Typography sx={{ marginBottom: 1 }}>
            Для добавления сразу нескольких тегов разделяйте слова пробелами
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Название тега"
            fullWidth
            variant="outlined"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTagDialog}>Отмена</Button>
          <Button
            onClick={handleAddTag}
            color="primary"
            disabled={!newTag.trim() || isAddingTags}
          >
            {isAddingTags ? "Добавление..." : "Добавить"}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedKey && (
        <VersionHistoryDialog
          open={isHistoryDialogOpen}
          onClose={handleCloseHistoryDialog}
          selectedKey={selectedKey}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
