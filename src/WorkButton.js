import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import RefreshIcon from "@material-ui/icons/Refresh";
const useStyles = makeStyles((theme) => ({
  fabButton: {
    position: "absolute",
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    backgroundColor: green[400],
    "&:hover": {
      backgroundColor: green[700]
    },
    margin: "0 auto"
  },
  fabProgress: {
    color: green[600],
    position: "absolute",
    top: -36,
    left: -6,
    right: 0,
    zIndex: 1,
    margin: "0 auto"
  }
}));

export default function WorkButton(props) {
  const classes = useStyles();
  const { onAsyncWork } = props;
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef();

  React.useEffect(() => {
    console.log("WorkButton useEffect called!");
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const handleButtonClick = () => {
    if (!loading) {
      setLoading(true);
      onAsyncWork && onAsyncWork();
      timer.current = setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  };

  return (
    <>
      <Fab
        aria-label="work-fab"
        color="primary"
        className={classes.fabButton}
        onClick={handleButtonClick}
      >
        <RefreshIcon />
      </Fab>
      {loading && (
        <CircularProgress size={68} className={classes.fabProgress} />
      )}
    </>
  );
}

WorkButton.propTypes = {
  onAsyncWork: PropTypes.func
};
