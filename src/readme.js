import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Drawer from "@material-ui/core/Drawer";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Accordion from "@material-ui/core/Accordion";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles((theme) => ({
  root: {
    width: 300
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: "33.33%",
    flexShrink: 0
  },
  table: {
    minWidth: 250
  }
}));
export default function Readme(props) {
  const { open, onClose } = props;
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  function createData(name, minVer, note) {
    return { name, minVer, note };
  }

  const rows = [
    createData("IE", "11", "win8或以上"),
    createData("Edge", ">=14", ""),
    createData("Firefox", ">=52", ""),
    createData("Firefox for Android", ">=68", ""),
    createData("Chrome", ">=49", ""),
    createData("Chrome for Android", ">=81", ""),
    createData("Safari", ">=10", ""),
    createData("Opera", ">=15", ""),
    createData("Opera mobile", ">=46", ""),
    createData("Samsung", ">=9.2", ""),
    createData("QQ", ">=10.4", ""),
    createData("Baidu", ">=7.12", ""),
    createData("KaiOS", ">=2.5", ""),
    createData("Android", ">=4.4.4", "")
  ];
  const genSupportedBrowsers = () => {
    return (
      <TableContainer component={Paper}>
        <Table
          className={classes.table}
          size="small"
          aria-label="support browsers table"
        >
          <TableHead>
            <TableRow>
              <TableCell>浏览器</TableCell>
              <TableCell align="right">版本</TableCell>
              <TableCell align="right">说明</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell align="right">{row.minVer}</TableCell>
                <TableCell align="right">{row.note}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose();
      }}
    >
      <div className={classes.root}>
        <Accordion
          expanded={expanded === "panel1"}
          onChange={handleChange("panel1")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Typography className={classes.heading}>支持的浏览器</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              凡符合MediaSource Extensions标准的现代浏览器都可以正确播放，如
              android系统原生浏览器/chrome/firefox/opera/edge/微信浏览器/搜狗浏览器/safari/百度浏览器/sumsung浏览器等。
              {genSupportedBrowsers()}
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel2"}
          onChange={handleChange("panel2")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2bh-content"
            id="panel2bh-header"
          >
            <Typography className={classes.heading}>苹果系统用户</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Apple系统用户请使用系统自带的safari浏览器播放,以便获取更好的视频效果。
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel3"}
          onChange={handleChange("panel3")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3bh-content"
            id="panel3bh-header"
          >
            <Typography className={classes.heading}>WINDOWS电脑用户</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              注意：如果用ie浏览器，ie版本必须是11以上，并且操作系统必须win8或以上版本，除ie外，其它浏览器在电脑上都应该能正常播放。
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel4"}
          onChange={handleChange("panel4")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel4bh-content"
            id="panel4bh-header"
          >
            <Typography className={classes.heading}>
              兼容性不好的浏览器
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              经过我们的测试，手机端浏览器目前兼容性不好的浏览器有：1、手机版UC浏览器
              2、百度app。 这两个浏览器hook了浏览器底层的html5 video element,
              将video窗口置于最高层， 播放时，菜单会被video窗口遮挡。
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel5"}
          onChange={handleChange("panel5")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel5bh-content"
            id="panel5bh-header"
          >
            <Typography className={classes.heading}>
              IPC摄像头直播说明
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div>
              <Typography variant="subtitle2" gutterBottom>
                为什么第一次请求摄像头时很慢，慢时可能要等5-10秒才会出现直播画面？
              </Typography>
              <Typography variant="body2" gutterBottom>
                由于我们的html5直播采用的fragment mp4的分片技术，
                第一次请求摄像头时，需实时向摄像头协商拉流，
                并同时缓冲一个分片才能播放，这个分片最短是一个h264/h265的gof序列,
                我们设定为2秒；更为糟糕的是，hikvison（海康）的很多低端ipc第一次传输视频时，
                ps流不发送关键帧，必须要等到下一个关键帧序列传来才能播放，这又增加了好几秒的等待。
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                IPC分辨率及码流
              </Typography>
              <Typography variant="body2" gutterBottom>
                我们统一为用户提供720p分辨率的超清效果视频，码流为：1Mbps/秒，请流量观看的用户注意。
              </Typography>
            </div>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel6"}
          onChange={handleChange("panel6")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel6bh-content"
            id="panel6bh-header"
          >
            <Typography className={classes.heading}>网络注意</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              目前我们的云直播服务器采用的电信骨干网络，建议用户使用电信网络能获取得更流畅的视频效果。
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel7"}
          onChange={handleChange("panel7")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel7bh-content"
            id="panel7bh-header"
          >
            <Typography className={classes.heading}>直播延时</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              考虑兼容性，我们的目前的html5直播采用的fragment mp4的直播技术，
              为降低码流、提升效果，我们将摄像头的关键帧间隔设为2秒，文件分片为3片；
              因此直播的延时在 2-6秒的范围内。
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={expanded === "panel8"}
          onChange={handleChange("panel8")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel8bh-content"
            id="panel8bh-header"
          >
            <Typography className={classes.heading}>服务电话</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              联系人：成老师 电话：18996334689/13452128106 微信：同手机号
              QQ:104037806
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
    </Drawer>
  );
}

Readme.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func
};

Readme.defaultProps = {
  open: true,
  onClose: () => {}
};
