import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Popper from "@material-ui/core/Popper";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import sha1 from "js-sha1";
import browserCookie from "browser-cookies";
import AsyncFetch from "./AsyncFetch";
import { Drawer } from "@material-ui/core";

const ERR_NO_ACCOUNT = 0x800000f;
const ERR_INVALID_PWD = ERR_NO_ACCOUNT + 1;
const ERR_OVERDUE = ERR_INVALID_PWD + 1;
const ERR_INTERNAL = ERR_OVERDUE + 1;

const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    margin: "0px",
    padding: "0px",
    flexFlow: "row",
    justifyContent: "center"
  },
  typography: {
    padding: theme.spacing(2)
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    position: "relative",
    margin: theme.spacing(2)
  },
  button: {
    margin: theme.spacing(2)
  }
}));

function login(uri, uid, password, onResult) {
  let qparams = { ts: Date.now() };
  if (uid && password) {
    /** 用户手动输入 */
    let path = uri;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      let posb = uri.indexOf("/", 8);
      path = uri.substr(posb);
    }
    console.log("path:" + path);
    let h1 = sha1(uid + ":" + password);
    let h2 = sha1(password + ":" + path);
    let h3 = sha1(uid + ":" + password + ":" + path);
    qparams.token = sha1(h1 + ":" + h2 + ":" + h3);
    qparams.username = uid;
  }

  AsyncFetch(uri, qparams, "GET", "fetch")
    .then((response) => {
      onResult(response.result, response.camlist);
    })
    .catch((error) => {
      onResult(ERR_INTERNAL, null);
    });
}

function LoginUI(props) {
  const classes = useStyles();
  const { force, open, onClose, uri, onGetCameraList } = props;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [values, setValues] = React.useState({
    username: "",
    password: "",
    message: ""
  });

  const butEl = React.useRef(null);

  function showPopper(msg) {
    if (anchorEl) {
      return;
    }
    setValues({ ...values, message: msg });
    let ael = butEl.current;
    setAnchorEl(ael);
    var tid = window.setTimeout(() => {
      setAnchorEl(null);
      window.clearTimeout(tid);
    }, 6000);
  }

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value.trim() });
  };

  const handleLogin = (event) => {
    console.log("username:" + values.username);
    if (values.username === "" || values.password === "") {
      showPopper("用户名或口令不能为空!");
    } else {
      if (!force) {
        let username = browserCookie.get("username");
        if (username === values.username) {
          showPopper("您已登录!!!");
          return;
        }
      }
      login(uri, values.username, values.password, (ret, camlist) => {
        if (ret === 0) {
          camlist.username = values.username;
          onGetCameraList(ret, camlist);
        } else if (ret === ERR_NO_ACCOUNT) {
          showPopper("用户名不存在!!!");
        } else if (ret === ERR_INVALID_PWD) {
          showPopper("口令错误!!!");
        } else if (ret === ERR_OVERDUE) {
          showPopper("帐户已过期!!!");
        } else {
          showPopper("网络出了点问题，请稍候再试!");
        }
      });
    }
  };

  function handleClose() {
    onClose();
  }

  React.useEffect(() => {
    console.log("LoginUI useEffect!");
    /** 用cookies中的用户名 */
    login(uri, null, null, (result, camlist) => {
      if (result === 0) {
        camlist.username = browserCookie.get("username");
      }
      onGetCameraList(result, camlist);
    });
  }, [uri, onGetCameraList]);

  const genLoginActions = () => {
    return (
      <Button
        type="submit"
        variant="outlined"
        color="primary"
        className={classes.button}
        aria-describedby={id}
        ref={butEl}
        onClick={handleLogin}
      >
        登录
      </Button>
    );
  };
  const genLoginForm = () => {
    return (
      <div className={classes.form}>
        <TextField
          variant="outlined"
          margin="dense"
          required
          fullWidth
          id="email"
          label="请输入用户名"
          autoComplete="email"
          autoFocus
          value={values.username}
          onChange={handleChange("username")}
        />
        <TextField
          variant="outlined"
          margin="dense"
          required
          fullWidth
          label="请输入口令"
          type="password"
          id="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange("password")}
        />
      </div>
    );
  };

  const genPopper = (pid, popen) => {
    return (
      <Popper id={pid} open={popen} anchorEl={anchorEl} disablePortal={true}>
        <Paper>
          <Typography className={classes.typography}>
            {values.message}
          </Typography>
        </Paper>
      </Popper>
    );
  };

  const genLoginBottom = (pid, popen) => {
    return (
      <Drawer anchor="bottom" open={open} onClose={handleClose}>
        <div className={classes.content}>
          {genLoginForm()}
          {genLoginActions()}
          {genPopper(pid, popen)}
        </div>
      </Drawer>
    );
  };

  const popen = Boolean(anchorEl);
  const id = popen ? "login-popper" : undefined;
  return genLoginBottom(id, popen);
}
LoginUI.propTypes = {
  force: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  uri: PropTypes.string.isRequired,
  onGetCameraList: PropTypes.func.isRequired
};
export { login, LoginUI };
