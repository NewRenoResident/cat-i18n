import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface NotificationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  closeButtonText?: string;
}

export const NotificationDialog = ({
  open,
  title,
  message,
  onClose,
  closeButtonText = "Закрыть",
}: NotificationDialogProps) => {
  if (!message && !title) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose} // Handles backdrop click & escape key
      aria-labelledby="notification-dialog-title"
      aria-describedby="notification-dialog-description"
    >
      <DialogTitle id="notification-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="notification-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          {closeButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
