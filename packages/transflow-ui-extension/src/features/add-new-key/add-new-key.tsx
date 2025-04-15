import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { AddTranslationsBody } from "@cat-i18n/shared";
import { useAddTranslation } from "./useAddTranslation";
interface IAddNewKey {
  locale: string;
}

export const AddNewKey = ({ locale }: IAddNewKey) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsAddDialogOpen(true)}
        variant="contained"
        fullWidth
        sx={{ marginBottom: 1 }}
      >
        Добавить ключ
      </Button>
      <AddTranslationDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        locale={locale}
      />
    </>
  );
};

const AddTranslationDialog = ({
  open,
  onClose,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  locale: string;
}) => {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<{ key?: string; value?: string }>({});

  const queryClient = useQueryClient();

  // Используем наш хук useAddTranslation
  const addTranslationMutation = useAddTranslation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      onClose();
      setKey("");
      setValue("");
      setError({});
    },
    onError: (error) => {
      console.error("Failed to add translation:", error);
    },
  });

  const handleSubmit = () => {
    const newErrors: { key?: string; value?: string } = {};

    if (!key.trim()) {
      newErrors.key = "Ключ не может быть пустым";
    }

    setError(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const translationData: AddTranslationsBody = {
        locale,
        translations: { [key]: value },
        userId: "current-user-id",
      };

      addTranslationMutation.mutate(translationData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить перевод</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Ключ перевода"
            fullWidth
            value={key}
            onChange={(e) => setKey(e.target.value)}
            error={!!error.key}
            helperText={error.key}
            disabled={addTranslationMutation.isPending}
          />
          <TextField
            label="Значение перевода"
            fullWidth
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={!!error.value}
            helperText={error.value}
            disabled={addTranslationMutation.isPending}
            multiline
            rows={4}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={addTranslationMutation.isPending}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={addTranslationMutation.isPending}
          startIcon={
            addTranslationMutation.isPending ? (
              <CircularProgress size={20} />
            ) : null
          }
        >
          {addTranslationMutation.isPending ? "Добавление..." : "Добавить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
