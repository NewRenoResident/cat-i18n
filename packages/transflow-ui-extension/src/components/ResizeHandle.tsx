import { styled } from "@mui/material";

export const ResizeHandle = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "6px",
  cursor: "ns-resize",
  backgroundColor: "transparent",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
});
