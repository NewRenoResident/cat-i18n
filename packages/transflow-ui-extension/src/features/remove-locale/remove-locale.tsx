import React from "react";
import { useTransFlow } from "@cat-i18n/scottish-fold";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useRemoveLocaleMutation } from "../add-locale/api/locales.api";

export const RemoveLocale = () => {
  const { locale, setLocale, availableLocales, getAvailableLocales } =
    useTransFlow();
  const removeLocaleMutation = useRemoveLocaleMutation();

  const handleRemove = async () => {
    if (availableLocales.length <= 1) {
      alert("Cannot remove the last available locale.");
      return;
    }

    // Confirmation dialog (replace with MUI Dialog for better UX)
    const confirmed = window.confirm(
      `Are you sure you want to permanently remove the locale "${locale}" and all its translations? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        removeLocaleMutation.mutate(locale);

        const newLocaleToSelect = availableLocales.find(
          (loc) => loc !== locale
        );
        if (newLocaleToSelect) {
          setLocale(newLocaleToSelect);
        } else if (availableLocales.length > 0) {
          setLocale(availableLocales[0]);
        }

        alert(`Locale "${locale}" removed successfully.`);
      } catch (error) {
        console.error("Failed to remove locale:", error);
        alert(
          `Failed to remove locale "${locale}". Check console for details.`
        );
      }
    }
  };

  const canRemove = availableLocales.length > 1 && !!locale;

  return (
    <Tooltip
      title={
        canRemove ? `Remove locale "${locale}"` : "Cannot remove last locale"
      }
    >
      <span>
        <IconButton
          color="error"
          onClick={handleRemove}
          disabled={!canRemove || removeLocaleMutation.isPending}
          size="small"
        >
          <DeleteOutlineIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};
