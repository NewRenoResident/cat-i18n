import { List, styled } from "@mui/material";

export const ScrollableList = styled(List)({
  maxHeight: "calc(100vh - 250px)",
  overflow: "auto",
});
