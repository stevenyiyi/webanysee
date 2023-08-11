import React from "react";
import sha1 from "js-sha1";
import _ from "lodash";
/*eslint no-extend-native: ["error", { "exceptions": ["Date"] }]*/
Date.prototype.Format = function (fmt) {
  //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};

function supportsMediaSource() {
  let hasWebKit = "WebKitMediaSource" in window;
  let hasMediaSource = "MediaSource" in window;

  return hasWebKit || hasMediaSource;
}

function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = React.useRef();
  // Store current value in ref
  React.useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

function useWindowSize() {
  const [size, setSize] = React.useState([0, 0]);
  React.useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

// flattens an object (recursively!), similarly to Array#flatten
// e.g. flatten({ a: { b: { c: "hello!" } } }); // => "hello!"
function flatten(object) {
  var check = _.isPlainObject(object) && _.size(object) === 1;
  return check ? flatten(_.values(object)[0]) : object;
}

function parseXml(xml) {
  var data = {};

  var isText = xml.nodeType === 3,
    isElement = xml.nodeType === 1,
    body = xml.textContent && xml.textContent.trim(),
    hasChildren = xml.children && xml.children.length,
    hasAttributes = xml.attributes && xml.attributes.length;

  // if it's text just return it
  if (isText) {
    return xml.nodeValue.trim();
  }

  // if it doesn't have any children or attributes, just return the contents
  if (!hasChildren && !hasAttributes) {
    return body;
  }

  // if it doesn't have children but _does_ have body content, we'll use that
  if (!hasChildren && body.length) {
    data.text = body;
  }

  // if it's an element with attributes, add them to data.attributes
  if (isElement && hasAttributes) {
    data.attributes = _.reduce(
      xml.attributes,
      function (obj, name, id) {
        var attr = xml.attributes.item(id);
        obj[attr.name] = attr.value;
        return obj;
      },
      {}
    );
  }

  // recursively call #parse over children, adding results to data
  _.each(xml.children, function (child) {
    var name = child.nodeName;

    // if we've not come across a child with this nodeType, add it as an object
    // and return here
    if (!_.has(data, name)) {
      data[name] = parseXml(child);
      return;
    }

    // if we've encountered a second instance of the same nodeType, make our
    // representation of it an array
    if (!_.isArray(data[name])) {
      data[name] = [data[name]];
    }

    // and finally, append the new child
    data[name].push(parseXml(child));
  });

  // if we can, let's fold some attributes into the body
  _.each(data.attributes, function (value, key) {
    if (data[key] != null) {
      return;
    }
    data[key] = value;
    delete data.attributes[key];
  });

  // if data.attributes is now empty, get rid of it
  if (_.isEmpty(data.attributes)) {
    delete data.attributes;
  }

  // simplify to reduce number of final leaf nodes and return
  return flatten(data);
}

/** 根据oid,domain产生播放地址 */
const genPlayUri = (oid, domain) => {
  let uri = "";
  if (domain) {
    uri = `http://${domain}/live/${oid}_master.m3u8`;
  } else {
    uri = `/live/${oid}_master.m3u8`;
  }
  return uri;
};

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function calcToken(username, password, path) {
  let h1 = sha1(username + ":" + password);
  let h2 = sha1(password + ":" + path);
  let h3 = sha1(username + ":" + password + ":" + path);
  let token = sha1(h1 + ":" + h2 + ":" + h3);
  return token;
}

/** 给每一个camera 增加属性 'selected' 并返回默认选择播放的url及是否用主码流*/
function fixCameraList(camlist) {
  // 预处理 camlist
  let obj = { playuri: "", is_main_stream: true };
  if (camlist.cameras) {
    let dcams = camlist.cameras.map((cam) => {
      if (cam.status === 1 && !obj.playuri) {
        cam["selected"] = true;
        obj.playuri = genPlayUri(cam.oid, cam.domain);
        obj.is_main_stream = cam.is_main_stream;
      } else {
        cam["selected"] = false;
      }
      return cam;
    });
    camlist.cameras = dcams;
  }
  if (camlist.groups) {
    let cgroups = camlist.groups.map((group) => {
      group.cameras.forEach((cam, index, theArray) => {
        if (cam.status === 1 && !obj.playuri) {
          theArray[index].selected = true;
          obj.playuri = genPlayUri(cam.oid, cam.domain);
          obj.is_main_stream = cam.is_main_stream;
        } else {
          theArray[index].selected = false;
        }
      });
      return { ...group, unfold: true };
    });
    camlist.groups = cgroups;
  }
  return obj;
}
export {
  supportsMediaSource,
  usePrevious,
  useWindowSize,
  parseXml,
  genPlayUri,
  randomString,
  calcToken,
  fixCameraList
};
