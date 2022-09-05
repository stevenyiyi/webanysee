import Hls from "hls.js";
import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
const useStyles = makeStyles((theme) => ({
  player_area: {
    display: "flex",
    position: "absolute",
    justifyContent: "center"
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    zIndex: "auto"
  }
}));
export default function CameraPlayer(props) {
  const {
    url,
    controls,
    autoplay,
    hlsConfig,
    onError,
    onSuccess,
    width,
    height,
    poster,
    refreshId,
    videoProps
  } = props;
  const classes = useStyles();
  const refHls = React.useRef();
  const refVideo = React.useRef();

  React.useEffect(() => {
    refVideo.current.onerror = () => {
      let err = refVideo.current.error;
      refVideo.current.pause();
      refVideo.current.src = "";
      refVideo.current.removeAttribute("src"); // empty source
      refVideo.current.load();
      onError && onError(err);
    };

    refVideo.current.onplay = (event) => {
      onSuccess && onSuccess(url);
    };

    const createMsePlayer = () => {
      let ohls = new Hls(hlsConfig);
      refHls.current = ohls;
      refHls.current.on(Hls.Events.MANIFEST_PARSED, () => {
        refVideo.current.play();
      });

      refHls.current.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.log("media error encountered, try to recover");
            refHls.current.recoverMediaError();
          } else {
            console.log("Error,type:" + data.type + " details:" + data.details);
            refHls.current.stopLoad();
            refHls.current.detachMedia();
            refHls.current.destroy();
            refHls.current = null;
            onError && onError(data);
          }
        }
      });
      refHls.current.loadSource(url);
      refHls.current.attachMedia(refVideo.current);
    };
    const createHlsPlayer = () => {
      // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
      // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element through the `src` property.
      // This is using the built-in support of the plain video element, without using hls.js.
      // Note: it would be more normal to wait on the 'canplay' event below however on Safari (where you are most likely to find built-in HLS support) the video.src URL must be on the user-driven
      // white-list before a 'canplay' event will be emitted; the last video event that can be reliably listened-for when the URL is not on the white-list is 'loadedmetadata'.
      console.log("Browser not support mse, but can play m3u8!");
      refVideo.current.src = url;
      refVideo.current.load();
      refVideo.current.oncanplaythrough = (event) => {
        if (autoplay) {
          refVideo.current.play();
        }
      };
    };
    console.log(
      `CameraPlayer useEffect,url:${url},refreshid:${refreshId},hls:${refHls.current},video:${refVideo.current}`
    );
    if (Hls.isSupported()) {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
        refHls.current = null;
      }
      if (url) {
        createMsePlayer();
      }
    } else if (refVideo.current.canPlayType("application/vnd.apple.mpegurl")) {
      refVideo.current.pause();
      refVideo.current.src = ""; // empty source
      refVideo.current.removeAttribute("src");
      refVideo.current.load();
      if (url) {
        createHlsPlayer();
      }
    } else {
      let err = new MediaError();
      err.code = MediaError.MEDIA_ERR_DECODE;
      err.message =
        "浏览器太老了,请下载一款支持MediaSourceExtension功能的浏览器!";
      onError && onError(err);
    }
    return () => {
      if (refHls.current) {
        console.log("Destory hls!");
        refHls.current.stopLoad();
        refHls.current.detachMedia();
        refHls.current.destroy();
        refHls.current = null;
      }
    };
  }, [hlsConfig, url, autoplay, refreshId, onError, onSuccess]);
  console.log("CameraPlayer render!");
  return (
    <video
      ref={refVideo}
      className={classes.video}
      width={width}
      hieght={height}
      controls={controls}
      crossOrigin="use-credentials"
      poster={poster}
      preload="auto"
      autoPlay
      muted
      webkit-playsinline="true"
      playsInline
      x5-video-player-type="h5"
      x-webkit-airplay="allow"
      {...videoProps}
    />
  );
}

CameraPlayer.propTypes = {
  url: PropTypes.string.isRequired,
  controls: PropTypes.bool,
  autoplay: PropTypes.bool,
  hlsConfig: PropTypes.object, //https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning
  width: PropTypes.number,
  height: PropTypes.number,
  poster: PropTypes.string,
  videoProps: PropTypes.object,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  refreshId: PropTypes.number
};

CameraPlayer.defaultProps = {
  url: "",
  controls: true,
  autoplay: false,
  hlsConfig: {},
  width: 888,
  height: 500,
  poster: "",
  videoProps: {},
  onError: (data) => {
    return;
  },
  onSuccess: (url) => {
    return;
  },
  refreshId: 0
};
