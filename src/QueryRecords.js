import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Drawer from "@material-ui/core/Drawer";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import TheatersIcon from "@material-ui/icons/Theaters";
import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import { parseXml } from "./utils.js";
const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    flexFlow: "column",
    height: "500px"
  },
  contentList: {
    display: "flex",
    alignSelf: "stretch",
    flexGrow: 1,
    overflowY: "scroll"
  },
  fullList: {
    width: "100%",
    backgroundColor: theme.palette.background.paper
  },
  contentForm: {
    display: "flex",
    margin: "0px",
    padding: "0px",
    flexFlow: "row",
    justifyContent: "center"
  },
  form: {
    display: "flex",
    width: "100%", // Fix IE 11 issue.
    position: "relative",
    flexFlow: "column",
    margin: theme.spacing(2)
  },
  wrapper: {
    margin: theme.spacing(2),
    position: "relative"
  },
  button: {
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
}));

export default function QueryRecords(props) {
  const classes = useStyles();
  const { open, onClose, camera, onPlayRecord } = props;
  const getLocalISOTime = (diff) => {
    let tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    let localISOTime = new Date(Date.now() + diff - tzoffset)
      .toISOString()
      .slice(0, -1);
    return localISOTime;
  };
  const [startts, setStartts] = React.useState(getLocalISOTime(-3600000));
  const [endts, setEndts] = React.useState(getLocalISOTime(0));
  const [records, setRecords] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef();

  React.useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const handleStartTsChange = (event) => {
    console.log(`Startts:${event.target.value}`);
    setStartts(event.target.value);
  };
  const handleEndTsChange = (event) => {
    console.log(`Endts:${event.target.value}`);
    setEndts(event.target.value);
  };

  const handleQuery = () => {
    if (!loading) {
      setLoading(true);
      timer.current = window.setTimeout(() => {
        setLoading(false);
      }, 2000);
    }

    let url = `/live/query_device_record?DeviceID=${camera.oid}&StartTime=${startts}&EndTime=${endts}`;
    fetch(url, {
      credentials: "include",
      method: "GET",
      mode: "cors",
      cache: "no-cache"
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(`Server response was ${response.status}.`);
      })
      .then((xmlContent) => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(xmlContent, "application/xml");
        if (dom.documentElement.nodeName === "parsererror") {
          console.log(`Invalid xml response:${xmlContent}`);
          return;
        }

        let items = parseXml(dom).RecordList.Item;
        if (items) {
          if (Array.isArray(items)) setRecords(items);
          else setRecords([items]);
        }
      })
      .catch((error) => {
        console.log(
          "There has been a problem with your fetch operation: ",
          error.message
        );
      });
  };

  const handlePlayRecord = (record) => {
    onPlayRecord(record.DeviceId, record.FilePath);
    onClose();
  };

  const genRecordList = () => {
    return (
      records &&
      records.map((record) => {
        return (
          <ListItem key={record.FilePath}>
            <ListItemAvatar>
              <Avatar>
                <TheatersIcon />
                <PlayCircleFilledIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={`开始:${record.StartTime}`}
              secondary={`结束:${record.EndTime}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(event) => {
                  handlePlayRecord(record);
                }}
                aria-label="record-play"
              >
                <PlayCircleFilledIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })
    );
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <div className={classes.content}>
        <div className={classes.contentList}>
          <List
            component="nav"
            aria-label="channel-record-list"
            className={classes.fullList}
          >
            {genRecordList()}
          </List>
        </div>
        <div className={classes.contentForm}>
          <div className={classes.form}>
            <TextField
              id="record_start_ts"
              label="录像开始时间"
              type="datetime-local"
              value={startts}
              onChange={handleStartTsChange}
              InputLabelProps={{
                shrink: true
              }}
            />
            <TextField
              id="record_end_ts"
              label="录像结束时间"
              type="datetime-local"
              value={endts}
              onChange={handleEndTsChange}
              InputLabelProps={{
                shrink: true
              }}
            />
          </div>
          <div className={classes.wrapper}>
            <Button
              type="submit"
              variant="outlined"
              color="primary"
              className={classes.button}
              aria-describedby="query-record-button"
              onClick={handleQuery}
            >
              查询
            </Button>
            {loading && (
              <CircularProgress size={24} className={classes.buttonProgress} />
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

QueryRecords.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  camera: PropTypes.object.isRequired,
  onPlayRecord: PropTypes.func.isRequired
};

QueryRecords.defaultProps = {
  open: true,
  onClose: () => {},
  camera: null,
  onPlayRecord: (deviceid, file) => {}
};
