import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  IconButton,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState, useCallback, useEffect } from "react";
import { AddTranslationsBody } from "@cat-i18n/shared";
import { useAddTranslation } from "./useAddTranslation";

interface IAddNewKey {
  locale: string;
}

interface TranslationPair {
  id: number;
  key: string;
  value: string;
}

// Define the structure for errors associated with a pair
interface PairError {
  id: number;
  key?: string;
  value?: string;
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
        Добавить ключ(и)
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
  const [translationPairs, setTranslationPairs] = useState<TranslationPair[]>([
    { id: Date.now(), key: "", value: "" },
  ]);
  const [errors, setErrors] = useState<PairError[]>([]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTranslationPairs([{ id: Date.now(), key: "", value: "" }]);
      setErrors([]);
    }
  }, [open]);

  const handleCloseDialog = useCallback(() => {
    setTranslationPairs([{ id: Date.now(), key: "", value: "" }]);
    setErrors([]);
    onClose();
  }, [onClose]);

  const addTranslationMutation = useAddTranslation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error("Failed to add translation:", error);
    },
  });

  const addPair = () => {
    setTranslationPairs((prevPairs) => [
      ...prevPairs,
      { id: Date.now(), key: "", value: "" },
    ]);
  };

  const removePair = (idToRemove: number) => {
    setTranslationPairs((prevPairs) =>
      prevPairs.filter((pair) => pair.id !== idToRemove)
    );
    setErrors((prevErrors) =>
      prevErrors.filter((error) => error.id !== idToRemove)
    );
  };

  const handlePairChange = (
    id: number,
    field: "key" | "value",
    newValue: string
  ) => {
    setTranslationPairs((prevPairs) =>
      prevPairs.map((pair) =>
        pair.id === id ? { ...pair, [field]: newValue } : pair
      )
    );

    setErrors((prevErrors) =>
      prevErrors
        .map((error) => {
          if (error.id === id) {
            const updatedError: Partial<PairError> = { ...error };
            delete updatedError[field];

            const remainingErrorKeys = Object.keys(updatedError).filter(
              (k) =>
                k !== "id" &&
                updatedError[k as keyof Omit<PairError, "id">] !== undefined
            );

            if (remainingErrorKeys.length === 0) {
              return null;
            }
            return updatedError as PairError;
          }
          return error;
        })
        .filter((error): error is PairError => error !== null)
    );
  };

  const handleSubmit = () => {
    const newErrors: PairError[] = [];
    const translationsPayload: { [key: string]: string } = {};
    const keysSeen = new Set<string>();

    translationPairs.forEach((pair) => {
      let keyError: string | undefined = undefined;
      const trimmedKey = pair.key.trim();

      if (!trimmedKey) {
        keyError = "Ключ не может быть пустым";
      } else if (keysSeen.has(trimmedKey)) {
        keyError = "Этот ключ уже используется в этой форме";
      } else {
        keysSeen.add(trimmedKey);
        translationsPayload[trimmedKey] = pair.value;
      }

      if (keyError) {
        const existingErrorIndex = newErrors.findIndex((e) => e.id === pair.id);
        if (existingErrorIndex > -1) {
          newErrors[existingErrorIndex] = {
            ...newErrors[existingErrorIndex],
            key: keyError,
          };
        } else {
          newErrors.push({ id: pair.id, key: keyError });
        }
      }
    });

    setErrors(newErrors);

    if (newErrors.length === 0 && Object.keys(translationsPayload).length > 0) {
      const translationData: AddTranslationsBody = {
        locale,
        translations: translationsPayload,
        userId: "current-user-id", // Replace with actual user ID logic
      };
      addTranslationMutation.mutate(translationData);
    } else if (
      Object.keys(translationsPayload).length === 0 &&
      translationPairs.length > 0
    ) {
      console.log("No valid keys to submit.");
    }
  };

  const isPending = addTranslationMutation.isPending;

  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      {" "}
      <DialogTitle>Добавить переводы</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {" "}
          {translationPairs.map((pair, index) => {
            const pairErrors = errors.find((e) => e.id === pair.id);
            return (
              <Stack
                key={pair.id}
                direction="row"
                spacing={2}
                alignItems="flex-start"
              >
                <TextField
                  label={`Ключ ${index + 1}`}
                  fullWidth
                  value={pair.key}
                  onChange={(e) =>
                    handlePairChange(pair.id, "key", e.target.value)
                  }
                  error={!!pairErrors?.key}
                  helperText={pairErrors?.key || " "}
                  disabled={isPending}
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label={`Значение ${index + 1}`}
                  fullWidth
                  value={pair.value}
                  onChange={(e) =>
                    handlePairChange(pair.id, "value", e.target.value)
                  }
                  error={!!pairErrors?.value}
                  helperText={pairErrors?.value || " "}
                  disabled={isPending}
                  multiline
                  rows={1}
                  sx={{ flexGrow: 2 }}
                />
                {translationPairs.length > 1 && (
                  <IconButton
                    onClick={() => removePair(pair.id)}
                    disabled={isPending}
                    aria-label="Remove pair"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Stack>
            );
          })}
          <Box sx={{ display: "flex", justifyContent: "flex-start", pt: 1 }}>
            <Button
              onClick={addPair}
              disabled={isPending}
              startIcon={<AddIcon />}
              variant="outlined"
            >
              Добавить еще пару
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} disabled={isPending}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending || translationPairs.length === 0}
          startIcon={
            isPending ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isPending ? "Добавление..." : "Добавить все"}{" "}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
