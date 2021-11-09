import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ChangePwd from "./ChangePwd";
import Readme from "./readme";
import WorkButton from "./WorkButton";
import SimpleSnackbar from "./SimpleSnackbar";
const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2)
  },
  appBar: {
    top: "auto",
    bottom: 0
  },
  title: {
    display: "flex",
    alignItems: "baseline",
    flexGrow: 1,
    justifyContent: "space-between"
  }
}));

export default function Navbar(props) {
  const classes = useStyles();
  const { username, onRefreshData, onLogin } = props;
  const [stateValues, setStateValues] = React.useState({
    openChangePwd: false,
    anchorEl: null,
    openDrawer: false
  });

  const [message, setMessage] = React.useState({
    open: false,
    variant: "error",
    text: ""
  });

  const open = Boolean(stateValues.anchorEl);
  function handleMenu(event) {
    setStateValues({ ...stateValues, anchorEl: event.currentTarget });
  }

  function handleClose() {
    setStateValues({ ...stateValues, anchorEl: null });
  }

  const handleCloseMessage = () => {
    setMessage({ ...message, open: false });
  };

  function handleChangePwd() {
    setStateValues({ ...stateValues, openChangePwd: true, anchorEl: null });
  }

  function handleLogin() {
    setStateValues({ ...stateValues, anchorEl: null });
    onLogin && onLogin();
  }

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setStateValues({ ...stateValues, openDrawer: open });
  };

  const onChangePwdClose = (success) => {
    setStateValues({ ...stateValues, openChangePwd: false });
    if (success) {
      setMessage({
        ...message,
        open: true,
        variant: "success",
        text: "修改口令成功!"
      });
    }
  };

  return (
    <AppBar position="fixed" color="primary" className={classes.appBar}>
      <Toolbar>
        <IconButton
          edge="start"
          className={classes.menuButton}
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer(true)}
        >
          <MenuIcon />
        </IconButton>
        <WorkButton onAsyncWork={onRefreshData} />
        <div className={classes.title}>
          <Typography variant="subtitle2">WebAnysee</Typography>
          <Typography variant="body2">
            {username ? `欢迎您 ${username}!` : "欢迎您 游客!"}
          </Typography>
        </div>

        <IconButton
          edge="end"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={stateValues.anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          keepMounted
          transformOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogin}>
            {username ? "切换帐户" : "新帐户登录"}
          </MenuItem>
          {username && (
            <>
              <MenuItem onClick={handleChangePwd}>修改口令</MenuItem>
            </>
          )}
        </Menu>
        {stateValues.openChangePwd && (
          <ChangePwd
            username={props.username}
            open={stateValues.openChangePwd}
            onClose={onChangePwdClose}
          />
        )}
        {stateValues.openDrawer && (
          <Readme
            open={stateValues.openDrawer}
            onClose={() => {
              setStateValues({ ...stateValues, openDrawer: false });
            }}
          />
        )}
      </Toolbar>
      <SimpleSnackbar
        open={message.open}
        onClose={handleCloseMessage}
        variant={message.variant}
        message={message.text}
      />
    </AppBar>
  );
}

Navbar.propTypes = {
  username: PropTypes.string,
  onLogin: PropTypes.func,
  onRefreshData: PropTypes.func
};

Navbar.defaultProps = {
  username: "",
  onLogin: () => {},
  onRefreshData: () => {}
};
