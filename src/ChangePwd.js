import React from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import { Drawer } from "@material-ui/core";
import Popper from "@material-ui/core/Popper";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import browserCookies from "browser-cookies";
import aesjs from "aes-js";
import md5 from "md5";
import AsyncFetch from "./AsyncFetch";
import { calcToken } from "./utils";

const useStyles = makeStyles((theme) => ({
  typography: {
    padding: theme.spacing(2)
  },
  content: {
    display: "flex",
    margin: "0px",
    padding: "0px",
    flexFlow: "row",
    justifyContent: "center"
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    position: "relative",
    margin: theme.spacing(2)
  },
  button: {
    position: "relative",
    margin: theme.spacing(2)
  }
}));

export default function ChangePwd(props) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [values, setValues] = React.useState({
    old_password: "",
    new_password: "",
    re_new_password: "",
    message: ""
  });
  console.log("ChangePwd props:%o", props);
  const butEl = React.useRef(null);
  /** From  cookies invalidate old password */
  function validateOldPwd(oldpwd) {
    let isok = false;
    let token = browserCookies.get("token");
    let username = browserCookies.get("username");
    let path = "/sapling/login";
    let ctoken = calcToken(username, oldpwd, path);
    if (ctoken !== token) {
      path = "/sapling/get_camera_list";
      ctoken = calcToken(username, oldpwd, path);
      isok = ctoken === token ? true : false;
    } else {
      isok = true;
    }
    return isok;
  }
  function changePassword(oldpwd, newpwd) {
    let skey = md5(props.username + ":" + oldpwd);
    let bkey = aesjs.utils.hex.toBytes(skey);
    var t = Date.now();
    var aesEcb = new aesjs.ModeOfOperation.ctr(bkey, new aesjs.Counter(t));
    var textBytes = aesjs.utils.utf8.toBytes(newpwd);
    var encryptedBytes = aesEcb.encrypt(textBytes);
    var epwd = aesjs.utils.hex.fromBytes(encryptedBytes);
    console.log("encrypt password:" + epwd);
    let qparams = { newpwd: epwd, counter: t };
    AsyncFetch("/sapling/change_password", qparams, "GET", "fetch")
      .then((response) => {
        const ERR_NO_ACCOUNT = 0x800000f;
        const ERR_PWD = 0x8000010;
        const ERR_ACCESS_DEINED = 0x8000014;
        let ret = response.result;
        if (ret === 0) {
          handleClose(true);
        } else if (ret === ERR_NO_ACCOUNT) {
          showPopper("用户名不存在!");
        } else if (ret === ERR_PWD) {
          showPopper("原口令错误!");
        } else if (ret === ERR_ACCESS_DEINED) {
          showPopper("此帐户无权修改!");
        } else {
          showPopper("未知错误!");
        }
      })
      .catch((error) => {
        showPopper("网络出了点问题，请稍候再试!");
      });
  }
  function showPopper(msg) {
    if (anchorEl) {
      return;
    }
    setValues({ ...values, message: msg });
    let ael = butEl.current;
    setAnchorEl(ael);
    var tid = window.setTimeout(() => {
      setAnchorEl(null);
      clearTimeout(tid);
    }, 6000);
  }

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value.trim() });
  };

  const handleSubmit = (event) => {
    console.log("username:" + values.username);
    if (
      !values.old_password ||
      !values.new_password ||
      !values.re_new_password
    ) {
      showPopper("新老口令或重复新口令不能为空!");
    } else if (values.new_password !== values.re_new_password) {
      showPopper("新口令与重复新口令不一致!");
    } else if (!validateOldPwd(values.old_password)) {
      showPopper("老口令错误!");
    } else {
      changePassword(values.old_password, values.new_password);
    }
    event.preventDefault();
  };

  function handleClose(success) {
    props.onClose(success);
  }

  const open = Boolean(anchorEl);
  const id = open ? "change-pwd-popper" : undefined;

  console.log("render ChangePassword, open:%o", values);
  return (
    <Drawer
      anchor="bottom"
      open={props.open}
      onClose={() => {
        handleClose(false);
      }}
    >
      <div className={classes.content}>
        <div className={classes.form}>
          <TextField
            variant="outlined"
            margin="dense"
            required
            fullWidth
            label="请输入老口令"
            type="password"
            id="change-pwd-old-password"
            autoComplete="current-password"
            value={values.old_password}
            onChange={handleChange("old_password")}
          />
          <TextField
            variant="outlined"
            margin="dense"
            required
            fullWidth
            label="请输入新口令"
            type="password"
            id="change-pwd-new-password"
            autoComplete="current-password"
            value={values.new_password}
            onChange={handleChange("new_password")}
          />
          <TextField
            variant="outlined"
            margin="dense"
            required
            fullWidth
            label="请再次输入新口令"
            type="password"
            id="change-pwd-renew-password"
            autoComplete="current-password"
            value={values.re_new_password}
            onChange={handleChange("re_new_password")}
          />
        </div>
        <Button
          type="submit"
          variant="outlined"
          color="primary"
          className={classes.button}
          aria-describedby={id}
          ref={butEl}
          onClick={handleSubmit}
        >
          确认
        </Button>
      </div>

      <Popper id={id} open={open} anchorEl={anchorEl} disablePortal={true}>
        <Paper>
          <Typography className={classes.typography}>
            {values.message}
          </Typography>
        </Paper>
      </Popper>
    </Drawer>
  );
}
