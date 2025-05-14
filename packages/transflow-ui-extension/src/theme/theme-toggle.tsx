import { useTranslatorUI } from "../context/TranslatorUIContext";
type ThemeMode = "light" | "dark";
import { Popover, IconButton, Stack, Tooltip, Box } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useState } from "react";

export const ThemeSwitcherPopover = () => {
  const { themeMode, setThemeMode } = useTranslatorUI();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? "theme-popover" : undefined;

  return (
    <>
      <Tooltip title="Change theme">
        <IconButton
          aria-label="change theme"
          aria-describedby={id}
          onClick={handleClick}
          color="inherit"
        >
          {themeMode === "light" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Tooltip>

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
        <Box sx={{ p: 1 }}>
          {" "}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Switch to Light Theme">
              <IconButton
                onClick={() => handleThemeSelect("light")}
                color={themeMode === "light" ? "primary" : "inherit"} // Highlight if selected
                aria-label="select light theme"
              >
                <LightModeIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Switch to Dark Theme">
              <IconButton
                onClick={() => handleThemeSelect("dark")}
                color={themeMode === "dark" ? "primary" : "inherit"}
                aria-label="select dark theme"
              >
                <DarkModeIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};
