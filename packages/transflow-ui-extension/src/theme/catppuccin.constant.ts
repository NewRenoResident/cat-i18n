import { createTheme, Theme } from "@mui/material"; // Ensure createTheme is imported

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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinFrappe.surface0,
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

export const catppuccinLatte = {
  rosewater: "#dc8a78",
  flamingo: "#dd7878",
  pink: "#ea76cb",
  mauve: "#8839ef",
  red: "#d20f39",
  maroon: "#e64553",
  peach: "#fe640b",
  yellow: "#df8e1d",
  green: "#40a02b",
  teal: "#179299",
  sky: "#04a5e5",
  sapphire: "#209fb5",
  blue: "#1e66f5",
  lavender: "#7287fd",
  text: "#4c4f69",
  subtext1: "#5c5f77",
  subtext0: "#6c6f85",
  overlay2: "#7c7f93",
  overlay1: "#8c8fa1",
  overlay0: "#9ca0b0",
  surface2: "#acb0be",
  surface1: "#bcc0cc",
  surface0: "#ccd0da",
  base: "#eff1f5",
  mantle: "#e6e9ef",
  crust: "#dce0e8",
} as const;

export const catppuccinLightTheme: Theme = createTheme({
  palette: {
    mode: "light", // Set mode to light
    primary: {
      main: catppuccinLatte.mauve,
    },
    secondary: {
      main: catppuccinLatte.blue,
    },
    error: {
      main: catppuccinLatte.red,
    },
    warning: {
      main: catppuccinLatte.peach,
    },
    info: {
      main: catppuccinLatte.sapphire,
    },
    success: {
      main: catppuccinLatte.green,
    },
    background: {
      default: catppuccinLatte.base,
      paper: catppuccinLatte.mantle,
    },
    text: {
      primary: catppuccinLatte.text,
      secondary: catppuccinLatte.subtext1,
      disabled: catppuccinLatte.overlay1,
    },
    divider: catppuccinLatte.surface0,
    action: {
      active: catppuccinLatte.text,
      hover: catppuccinLatte.surface1,
      selected: catppuccinLatte.surface2,
      disabled: catppuccinLatte.overlay0,
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinLatte.surface0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinLatte.mantle,
          border: `1px solid ${catppuccinLatte.surface0}`,
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: catppuccinLatte.mantle,
        },
      },
    },
  },
});
