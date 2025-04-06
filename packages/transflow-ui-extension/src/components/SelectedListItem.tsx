import { ListItem, styled } from "@mui/material";

export const SelectedListItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));
