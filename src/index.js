/** @jsxRuntime classic */
import "react-app-polyfill/ie11";
import "core-js/stable";
import "regenerator-runtime/runtime";
// IE11 needs "jsxRuntime classic" for this initial file which means that "React" needs to be in scope
// issue: https://github.com/facebook/create-react-app/issues/9906
import React from "react";
import * as ReactDOM from "react-dom/client";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import CssBaseline from "@material-ui/core/CssBaseline";
import MobileDetect from "mobile-detect";
import { LoginUI } from "./Login";
import AsyncFetch from "./AsyncFetch";
import Navbar from "./Navbar";
import CameraList from "./CameraList";

const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    width: "100%",
    height: "100%",
    position: "relative",
    flexFlow: "column"
  }
}));

function App(props) {
  const url = "/sapling/get_camera_list";
  const classes = useStyles();

  const [openLogin, setOpenLogin] = React.useState(false);
  const [forceLogin, setForceLogin] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [cameraList, setCameraList] = React.useState(null);

  const onOpenLogin = React.useCallback(() => {
    setOpenLogin(true);
  }, []);

  const onCloseLogin = React.useCallback(() => {
    setOpenLogin(false);
  }, []);

  /** 从login组件获取cameralist 回调*/
  const onGetCameraList = React.useCallback((result, camlist) => {
    console.log("onGetCameraList callback!");
    if (result !== 0) {
      setForceLogin(true);
      setOpenLogin(true);
    } else {
      setOpenLogin(false);
      setForceLogin(false);
      setUsername(camlist.username);
      /** Setup camera list */
      setCameraList(camlist);
    }
  }, []);

  const refreshData = React.useCallback(() => {
    console.log("refreshData");
    let qparams = { ts: Date.now() };
    AsyncFetch(url, qparams, "GET", "fetch")
      .then((response) => {
        let result = response.result;
        if (result === 0) {
          let camlist = response.camlist;
          /** Setup camera list */
          setCameraList(camlist);
        } else {
          console.log(`从服务器获取列表失败,错误代码:${result}`);
        }
      })
      .catch((error) => {
        console.log(`取列表失败,错误:${error.name}:${error.message}`);
      });
  }, []);

  console.log("Index render!");
  return (
    <div className={classes.content}>
      <CssBaseline />
      <CameraList
        mobile={props.mobile}
        camlist={cameraList}
        onRefreshData={refreshData}
      />
      <LoginUI
        force={forceLogin}
        uri={url}
        open={openLogin}
        onClose={onCloseLogin}
        onGetCameraList={onGetCameraList}
      />
      <Navbar
        username={username}
        onRefreshData={refreshData}
        onLogin={onOpenLogin}
      />
    </div>
  );
}
App.propTypes = {
  mobile: PropTypes.bool,
  iphone: PropTypes.bool
};
(() => {
  var md = new MobileDetect(window.navigator.userAgent);
  let isMobile = md.mobile() ? true : false;
  let isIPhone = md.is("iPhone") && md.userAgent() === "Safari";
  console.log("mobile:" + isMobile + " iphone:" + isIPhone);
  const container = document.getElementById("root");
  const root = ReactDOM.createRoot(container);
  root.render(<App mobile={isMobile} iphone={isIPhone} />);
})();
