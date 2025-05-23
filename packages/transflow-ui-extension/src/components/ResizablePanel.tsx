import { Paper, styled } from "@mui/material";

export const ResizablePanel = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  minHeight: "200px",

  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
}));
