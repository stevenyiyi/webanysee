import React from "react";
import PropTypes from "prop-types";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

function MuiAlert(props) {
  return <Alert elevation={6} variant="filled" {...props} />;
}

export default function SimpleSnackbar(props) {
  const { open, onClose, variant, message } = props;
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    onClose();
  };

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <MuiAlert onClose={handleClose} severity={variant}>
        {message}
      </MuiAlert>
    </Snackbar>
  );
}

SimpleSnackbar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["error", "info", "success", "warning"]).isRequired,
  message: PropTypes.string.isRequired
};
