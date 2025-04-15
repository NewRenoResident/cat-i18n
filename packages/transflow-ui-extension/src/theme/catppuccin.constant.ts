import { createTheme, Theme } from "@mui/material";

export const catppuccinFrappe = {
  rosewater: "#f2d5cf",
  flamingo: "#eebebe",
  pink: "#f4b8e4",
  mauve: "#ca9ee6",
  red: "#e78284",
  maroon: "#ea999c",
  peach: "#ef9f76",
  yellow: "#e5c890",
  green: "#a6d189",
  teal: "#81c8be",
  sky: "#99d1db",
  sapphire: "#85c1dc",
  blue: "#8caaee",
  lavender: "#babbf1",
  text: "#c6d0f5",
  subtext1: "#b5bfe2",
  subtext0: "#a5adce",
  overlay2: "#949cbb",
  overlay1: "#838ba7",
  overlay0: "#737994",
  surface2: "#626880",
  surface1: "#51576d",
  surface0: "#414559",
  base: "#303446",
  mantle: "#292c3c",
  crust: "#232634",
} as const;

export const catppuccinTheme: Theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: catppuccinFrappe.mauve,
    },
    secondary: {
      main: catppuccinFrappe.blue,
    },
    error: {
      main: catppuccinFrappe.red,
    },
    warning: {
      main: catppuccinFrappe.peach,
    },
    info: {
      main: catppuccinFrappe.sapphire,
    },
    success: {
      main: catppuccinFrappe.green,
    },
    background: {
      default: catppuccinFrappe.base,
      paper: catppuccinFrappe.mantle,
    },
    text: {
      primary: catppuccinFrappe.text,
      secondary: catppuccinFrappe.subtext1,
      disabled: catppuccinFrappe.overlay1,
    },
    divider: catppuccinFrappe.surface0,
    action: {
      active: catppuccinFrappe.text,
      hover: catppuccinFrappe.surface1,
      selected: catppuccinFrappe.surface2,
      disabled: catppuccinFrappe.overlay0,
    },
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinFrappe.mantle,
          border: `1px solid ${catppuccinFrappe.surface0}`,
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinFrappe.mantle,
        },
      },
    },
  },
});
