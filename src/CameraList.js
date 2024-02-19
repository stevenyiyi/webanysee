import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import Collapse from "@material-ui/core/Collapse";
import MenuIcon from "@material-ui/icons/Menu";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import QueryRelordListIcon from "@material-ui/icons/PlaylistPlay";
import SimpleSnackbar from "./SimpleSnackbar";
import PlaylistPlay from "@material-ui/icons/Subscriptions";
import CamcorderOff from "@material-ui/icons/VideocamOff";
import Camcorder from "@material-ui/icons/Videocam";
import CameraPlayer from "./CameraPlayer";
import { green } from "@material-ui/core/colors";
import CircularProgress from "@material-ui/core/CircularProgress";
import Hls from "hls.js";
import { fixCameraList, genPlayUri, useWindowSize } from "./utils";
import QueryRecords from "./QueryRecords";
import DeviceQueryDlg from "./DeviceQueryDlg";
import { parseXml } from "./utils";
import browserCookie from "browser-cookies";
const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    width: "100%",
    height: "100%",
    paddingBottom: 50
  },
  mobile_content: {
    display: "flex",
    flexFlow: "column",
    width: "100%",
    height: "100%",
    paddingBottom: 50
  },
  pc_palyer: {
    display: "flex",
    flex: "3 1 75%",
    position: "relative",
    overflow: "auto",
    maxWidth: "1280px",
    justifyContent: "center",
    alignItems: "center",
    height: 0,
    paddingTop: "42.1875%",
    backgroundColor: "black"
  },
  mb_hd_player: {
    display: "flex",
    overflow: "hidden",
    position: "relative",
    height: 0,
    paddingTop: "56.25%", /// 16:9
    backgroundColor: "black"
  },
  mb_d1_player: {
    display: "flex",
    overflow: "hidden",
    position: "relative",
    height: 0,
    paddingTop: "81.82%", /// D1(704 * 576)
    backgroundColor: "black"
  },
  pc_camlist: {
    display: "flex",
    flex: "1 3 25%",
    minWidth: "200px",
    overflowY: "scroll"
  },
  mb_camlist: {
    display: "flex",
    alignSelf: "stretch",
    flexGrow: 1,
    overflowY: "scroll"
  },
  list_root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: theme.spacing(4)
  },
  normal: {
    paddingLeft: theme.spacing(2)
  },
  waitProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -24,
    marginLeft: -24
  }
}));

function reducer(message, action) {
  switch (action.type) {
    case "close":
      return { ...message, open: false };
    case "update":
      return {
        ...message,
        open: action.open,
        variant: action.variant,
        text: action.text
      };
    default:
      throw new Error("Unexpected action");
  }
}

export default function CameraList({ mobile, camlist, onRefreshData }) {
  const ITEM_HEIGHT = 48;
  const [streamUri, setStreamUri] = React.useState("");
  const [groups, setGroups] = React.useState(null);
  const [cameras, setCameras] = React.useState(null);
  const [playerRefreshId, setPlayerRefreshId] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [isMainStream, setIsMainStream] = React.useState(false);
  const [message, dispatch] = React.useReducer(reducer, {
    open: false,
    variant: "error",
    text: ""
  });

  /// 查询录像结果
  const [qRecords, setQRecords] = React.useState({
    open: false,
    camera: null
  });

  /// 查询设备结果
  const [queryDevice, setQueryDevice] = React.useState({
    open: false,
    data: null
  });

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedDevice, setSelectedDevice] = React.useState(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const timer = React.useRef();
  const refVideo = React.useRef();
  const mpdCheckUri = React.useRef("");
  const classes = useStyles();

  var triggerPlayerTimer = null;
  React.useLayoutEffect(() => {
    if (refVideo.current) {
      setDimensions({
        width: refVideo.current.offsetWidth,
        height: refVideo.current.offsetHeight
      });
      console.log(
        `useLayoutEffect, width:${refVideo.current.offsetWidth}, height:${refVideo.current.offsetHeight}`
      );
    }
  }, []);

  /** 处理播放错误 */
  const handlePlayerError = React.useCallback(
    (error) => {
      let msg = "";
      let variant = "";
      if (error instanceof MediaError) {
        let ecode = error.code;
        switch (ecode) {
          case MediaError.MEDIA_ERR_NETWORK:
            variant = "error";
            msg = "播放超时，将重新刷新观看列表...";
            onRefreshData();
            break;
          case MediaError.MEDIA_ERR_DECODE:
            variant = "error";
            msg = "浏览器不支持播放该视频格式!";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            variant = "error";
            msg = "不支持的播放格式，将重刷新列表...";
            onRefreshData();
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            variant = "info";
            msg = "请求播放终止.";
            break;
          default:
            variant = "error";
            msg = "未知错误!";
            onRefreshData();
            break;
        }
      } else {
        if (error.type === Hls.ErrorTypes.NETWORK_ERROR) {
          let details = error.details;
          if (
            details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
            details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
            details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR ||
            details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
            details === Hls.ErrorDetails.KEY_LOAD_ERROR
          ) {
            let rcode = error.response.code;
            if (rcode === 403) {
              variant = "warning";
              msg = "检测到您的帐户正在观看,请先退出,20秒后将自动重新连接...";
              console.log("url:" + error.url);
              triggerPlayerTimer(error.url);
            } else if (rcode === 404) {
              variant = "error";
              msg = "观看的流已经下线，将重新刷新观看列表!";
              onRefreshData();
            } else {
              variant = "error";
              msg = "服务器出了点问题,请稍候再试!错误代码:" + rcode;
            }
          } else if (
            details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.KEY_LOAD_TIMEOUT ||
            details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
          ) {
            variant = "error";
            msg = "加载文件超时，请检查网络是否正常...";
            onRefreshData();
          } else if (
            details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR ||
            details === Hls.ErrorDetails.LEVEL_EMPTY_ERROR
          ) {
            variant = "error";
            msg = "解析mainfest错误:" + error.reason;
          } else {
            variant = "error";
            msg = "服务器出了点问题，请稍候再试!";
            onRefreshData();
          }
        } else {
          variant = "error";
          msg =
            "无法播放此视频,错误类型：" +
            error.type +
            ",错误代码:" +
            error.details +
            ",描述:" +
            error.reason;
        }
      }
      dispatch({ type: "update", open: true, variant: variant, text: msg });
    },
    [onRefreshData, triggerPlayerTimer]
  );

  /// NVR is active ?
  const isNVRAlive = (group) => {
    if (browserCookie.get("role") !== "6") {
      return false;
    }
    if (group.gid.length !== 20 || (group.gid.substr(10, 3) !== "111" && group.gid.substr(10,3) !== "200")) {
      return false;
    }
    let f = false;
    for (const cam of group.cameras) {
      if (cam.status === 1) {
        f = true;
        break;
      }
    }
    return f;
  };

  const isAliveUser = () => {
    return browserCookie.get("role") === "6" ? true : false;
  };

  /// 处理关闭查询录像对话框
  const handleCloseRecords = React.useCallback(() => {
    setQRecords({ ...qRecords, open: false });
  }, [qRecords]);

  /// 处理关闭查询设备信息对话框
  const handleCloseDeviceQuery = React.useCallback(() => {
    setQueryDevice({ ...queryDevice, open: false });
  }, [queryDevice]);

  /// 处理播放录像文件
  const handlePlayRecord = React.useCallback((deviceid, filePath) => {}, []);

  const tryPullMediaMpd = React.useCallback(
    (playUrl, isUriChanged) => {
      /**Player uri or refreshMpdId changed */
      setLoading(true);
      fetch(playUrl, {
        credentials: "include",
        headers: {
          Accept: "application/x-mpegURL",
          "Content-type": "application/x-mpegURL"
        },
        cache: "no-cache",
        method: "GET",
        mode: "cors"
      })
        .then((response) => {
          setLoading(false);
          if (response.status !== 200) {
            /** Hls.ErrorDetails.MANIFEST_LOAD_ERROR -
             *  raised when manifest loading fails because of a network error -
             *  data: { type : NETWORK_ERROR, details : Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
             *  fatal : true, url : manifest URL,
             *  response : { code: error code, text: error text } }
             * */
            let err = {
              type: Hls.ErrorTypes.NETWORK_ERROR,
              details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
              fatal: true,
              url: playUrl,
              response: { code: response.status }
            };
            handlePlayerError(err);
          } else {
            setStreamUri(playUrl);
            if (!isUriChanged) {
              setPlayerRefreshId((playerRefreshId) => playerRefreshId + 1);
            }
          }
          return response.text();
        })
        .then((respText) => {
          console.log(`fetch mpd:${respText}`);
        })
        .catch((error) => {
          setLoading(false);
          console.error("fetch play uri error:", error.message);
        });
    },
    [handlePlayerError]
  );

  triggerPlayerTimer = React.useCallback(
    (uri) => {
      mpdCheckUri.current = uri;
      if (!timer.current || timer.current === 0) {
        timer.current = setInterval(() => {
          if (mobile) {
            tryPullMediaMpd(mpdCheckUri.current, false);
          } else {
            setPlayerRefreshId((playerRefreshId) => playerRefreshId + 1);
          }
        }, 20000);
      }
    },
    [mobile, tryPullMediaMpd]
  );

  React.useEffect(() => {
    console.log("cameralist changed!");
    if (!camlist) return;
    let clist = camlist;
    let robj = fixCameraList(clist);
    let puri = robj.playuri;
    setIsMainStream(robj.is_main_stream);
    if (clist.groups) setGroups(clist.groups);
    else setGroups(null);
    if (clist.cameras) setCameras(clist.cameras);
    else setCameras(null);
    if (mobile && puri) {
      tryPullMediaMpd(puri, true);
    } else {
      setStreamUri(puri);
    }
  }, [mobile, camlist, tryPullMediaMpd]);

  const handleCloseMessage = React.useCallback(() => {
    dispatch({ type: "close" });
  }, []);

  /** 视频组CLICK */
  const onGroupClick = (event) => {
    const idx = event.currentTarget.tabIndex;
    console.log("onGroupClick event:" + event);
    setGroups(
      groups.map((group, _index) =>
        _index === idx ? { ...group, unfold: !group.unfold } : group
      )
    );
  };

  const handlePlayerSuccess = React.useCallback((uri) => {
    console.log(`playing ${uri} success!`);
    if (timer.current && timer.current > 0) {
      clearInterval(timer.current);
      timer.current = 0;
    }
    setPlayerRefreshId(0);
    mpdCheckUri.current = "";
  }, []);

  /** Click play item camera*/
  const onCameraClick = (ccam) => {
    if (ccam.selected) return;
    let uri = genPlayUri(ccam.oid);
    if (mobile) {
      setIsMainStream(ccam.is_main_stream);
      /** Stop player (setup url null) */
      setStreamUri(null);
      tryPullMediaMpd(uri, true);
    } else {
      setStreamUri(uri);
    }
    /** 首先在 camera groups 中查找*/
    let issel = false;
    if (groups) {
      setGroups(
        groups.map((group) => {
          //Clear camera selected
          group.cameras.forEach((cam) => {
            if (cam.oid === ccam.oid) {
              cam.selected = true;
              issel = true;
            } else {
              cam.selected = false;
            }
          });
          return group;
        })
      );
    }
    if (!issel && cameras) {
      /**其次在最上层 cameras 中查找*/
      setCameras(
        cameras.map((cam) => {
          if (cam.oid === ccam.oid) {
            cam.selected = true;
          } else {
            cam.selected = false;
          }
          return cam;
        })
      );
    }
  };

  const handleNVRMenuClose = () => {
    setAnchorEl(null);
  };

  /// 处理设备命令
  const handleDeviceCommand = (cmd, params) => {
    setAnchorEl(null);
    let url = `/live/${cmd}`;
    let qparams = "";
    for (const [key, value] of Object.entries(params)) {
      if (!qparams) {
        qparams += `?${key}=${value}`;
      } else {
        qparams += `&${key}=${value}`;
      }
    }
    url += qparams;

    fetch(url, {
      credentials: "include",
      cache: "no-cache",
      method: "GET",
      mode: "cors"
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`Server response was ${response.status}.`);
        }
        return response.text();
      })
      .then((respText) => {
        if (cmd === "device_control") {
          dispatch({
            type: "update",
            open: true,
            variant: "info",
            text: `重启设备:${selectedDevice.gid} 成功!`
          });
        } else {
          const parser = new DOMParser();
          const dom = parser.parseFromString(respText, "application/xml");
          if (dom.documentElement.nodeName === "parsererror") {
            console.log(`Invalid xml response:${respText}`);
            return;
          }
          let data = parseXml(dom);
          handleQueryDevice(data);
        }
      })
      .catch((error) => {
        dispatch({
          type: "update",
          open: true,
          variant: "error",
          text: `${cmd}:${error.message}!`
        });
      });
  };

  /** 产生 NVR popup 菜单 */
  const genNVRMenu = () => {
    return (
      <Menu
        id="nebula-dev-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleNVRMenuClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: 200
          }
        }}
      >
        <MenuItem
          onClick={(event) => {
            handleDeviceCommand("device_control", {
              DeviceID: `${selectedDevice.gid}`,
              TeleBoot: "Boot"
            });
          }}
        >
          重启设备
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            handleDeviceCommand("query_device_info", {
              DeviceID: `${selectedDevice.gid}`
            });
          }}
        >
          设备信息
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            handleDeviceCommand("query_device_catalog", {
              DeviceID: `${selectedDevice.gid}`
            });
          }}
        >
          设备目录
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            handleDeviceCommand("query_device_status", {
              DeviceID: `${selectedDevice.gid}`
            });
          }}
        >
          设备状态
        </MenuItem>
        <MenuItem
          onClick={(event) => {
            handleDeviceCommand("query_device_config", {
              DeviceID: `${selectedDevice.gid}`
            });
          }}
        >
          设备配置
        </MenuItem>
      </Menu>
    );
  };
  /// 点击 NVR 菜单
  const handleNVRMenusClick = (event, value) => {
    setSelectedDevice(value);
    setAnchorEl(event.currentTarget);
  };

  /// 显示查询通道录像
  const handleQueryRecord = (cam) => {
    setQRecords({ ...qRecords, open: true, camera: cam });
  };

  /// 显示查询设备信息
  const handleQueryDevice = (response) => {
    setQueryDevice({ ...queryDevice, open: true, data: response });
  };

  function renderPlayer() {
    let vprops = {};
    const autoplay = true;
    return (
      <CameraPlayer
        url={streamUri}
        width={dimensions.width}
        height={dimensions.height}
        autoplay={autoplay}
        hlsConfig={hlsconfig}
        poster=""
        videoProps={vprops}
        onError={handlePlayerError}
        onSuccess={handlePlayerSuccess}
        refreshId={playerRefreshId}
      />
    );
  }

  function genCameraList(cameralist, nested) {
    const clist = cameralist.map((cam) => {
      const scam = JSON.stringify(cam);
      if (cam.status !== 1) {
        return (
          <ListItem
            alignItems="flex-start"
            className={nested ? classes.nested : classes.normal}
            button
            key={cam.oid}
            disabled
          >
            <ListItemIcon>
              <CamcorderOff />
            </ListItemIcon>
            <ListItemText primary={cam.name} />
          </ListItem>
        );
      } else {
        return (
          <ListItem
            alignItems="flex-start"
            className={nested ? classes.nested : classes.normal}
            selected={cam.selected}
            button
            key={cam.oid}
            itemvalue={scam}
            onClick={(event) => onCameraClick(cam)}
          >
            <ListItemIcon>
              <Camcorder />
            </ListItemIcon>
            <ListItemText primary={cam.name} />
            {isAliveUser() && (
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(event) => {
                    handleQueryRecord(cam);
                  }}
                  aria-label="query-channel-record"
                >
                  <QueryRelordListIcon />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        );
      }
    });
    return clist;
  }

  function genGroupList(camgroups) {
    let count = 0;
    return camgroups.map((group) => (
      <>
        <ListItem
          alignItems="flex-start"
          tabIndex={count++}
          key={group.gid}
          button
          onClick={(event) => onGroupClick(event)}
        >
          <ListItemIcon>
            <PlaylistPlay />
          </ListItemIcon>
          <ListItemText primary={group.name} />
          {group.unfold ? <ExpandLess /> : <ExpandMore />}
          {isNVRAlive(group) && (
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(event) => {
                  handleNVRMenusClick(event, group);
                }}
                aria-label="menu"
                aria-haspopup="true"
              >
                <MenuIcon />
              </IconButton>
              {genNVRMenu()}
            </ListItemSecondaryAction>
          )}
        </ListItem>
        {genGroupCameraList(group.cameras, group.unfold)}
      </>
    ));
  }

  function genGroupCameraList(cameralist, unfold) {
    return (
      <Collapse in={unfold} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {genCameraList(cameralist, true)}
        </List>
      </Collapse>
    );
  }

  // render
  // Normally, just render children
  let clsContent = null;
  let clsPlayer = null;
  let clsCamList = null;
  const [width, height] = useWindowSize();
  console.log(`CameraList render,window width: ${width}, height:${height}`);
  if (mobile) {
    clsCamList = classes.mb_camlist;
    if (isMainStream) {
      clsPlayer = classes.mb_hd_player;
    } else {
      clsPlayer = classes.mb_d1_player;
    }
    clsContent = classes.mobile_content;
  } else {
    clsCamList = classes.pc_camlist;
    clsPlayer = classes.pc_palyer;
    clsContent = classes.content;
  }

  const hlsconfig = React.useMemo(
    () => ({
      liveDurationInfinity: true,
      xhrSetup: function (xhr, url) {
        xhr.withCredentials = true; // do send cookies
      },
      fetchSetup: function (context, initParams) {
        // Always send cookies, even for cross-origin calls.
        initParams.credentials = "include";
        return new Request(context.url, initParams);
      }
    }),
    []
  );
  return (
    <div className={clsContent}>
      <div className={clsPlayer} ref={refVideo}>
        {renderPlayer()}
        {mobile && loading && (
          <CircularProgress size={48} className={classes.waitProgress} />
        )}
      </div>
      <div className={clsCamList}>
        <List className={classes.list_root} component="nav">
          {cameras && genCameraList(cameras, false)}
          {groups && genGroupList(groups)}
        </List>
      </div>
      <SimpleSnackbar
        open={message.open}
        onClose={handleCloseMessage}
        variant={message.variant}
        message={message.text}
      />
      <QueryRecords
        open={qRecords.open}
        onClose={handleCloseRecords}
        camera={qRecords.camera}
        onPlayRecord={handlePlayRecord}
      />
      <DeviceQueryDlg
        open={queryDevice.open}
        onClose={handleCloseDeviceQuery}
        data={queryDevice.data}
      />
    </div>
  );
}

CameraList.propTypes = {
  mobile: PropTypes.bool,
  camlist: PropTypes.object,
  onRefreshData: PropTypes.func
};

CameraList.defaultProps = {
  mobile: false,
  camlist: null,
  onRefreshData: () => {}
};
