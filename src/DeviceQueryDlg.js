import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Drawer from "@material-ui/core/Drawer";
import TreeView from "@material-ui/lab/TreeView";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import TreeItem from "@material-ui/lab/TreeItem";

const useStyles = makeStyles((theme) => ({
  root: {
    height: 240,
    flexGrow: 1,
    maxWidth: 500
  }
}));

export default function DeviceQueryDlg(props) {
  const { open, data, onClose } = props;
  const classes = useStyles();
  function handleClose() {
    onClose();
  }

  const genSingleItem = (key, value, nested) => {
    return <TreeItem nodeId={key} label={`${key}: ${value}`} />;
  };

  const genObjectSubItems = (key, value) => {
    return (
      <TreeItem nodeId={key} label={key}>
        {Object.entries(value).map(([k, v]) => {
          return genQueryItem(k, v, true);
        })}
      </TreeItem>
    );
  };

  const genArraySubItems = (key, value) => {
    return (
      <TreeItem nodeId={key} label={key}>
        {value.map((subitem) => {
          let arrobj = Object.entries(subitem);
          let sitems = arrobj.map(([k, v]) => {
            return genQueryItem(k, v, true);
          });
          return sitems;
        })}
      </TreeItem>
    );
  };

  const genQueryItem = (k, v, nested) => {
    if (v && Array.isArray(v)) {
      return genArraySubItems(k, v);
    } else if (v && typeof v === "object") {
      return genObjectSubItems(k, v);
    } else {
      return genSingleItem(k, v, nested);
    }
  };

  const genDeviceQueryList = () => {
    if (data) {
      return Object.entries(data).map(([key, value]) => {
        return genQueryItem(key, value, false);
      });
    } else {
      return null;
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={handleClose}>
      <TreeView
        className={classes.root}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        {genDeviceQueryList()}
      </TreeView>
    </Drawer>
  );
}

DeviceQueryDlg.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object
};

DeviceQueryDlg.defaultProps = {
  open: true,
  onClose: () => {},
  data: null
};
