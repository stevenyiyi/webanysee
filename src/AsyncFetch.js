export default async function AsyncFetch(url, data, type, method) {
  type = type.toUpperCase();
  let sendData;

  if (type === "GET") {
    let _data = [];
    Object.keys(data).forEach((key) => {
      _data.push(key + "=" + data[key]);
    });
    url = url + "?" + _data.join("&");
  } else {
    sendData = JSON.stringify(data);
  }

  if (window.fetch && method === "fetch") {
    let reqConfig = {
      credentials: "include",
      method: type,
      headers: {
        Accept: "application/json",
        "Content-type": "application/json"
      },
      mode: "cors",
      cache: "no-cache"
    };

    try {
      const response = await fetch(url, reqConfig);
      const responseJson = response.json();
      return responseJson;
    } catch (error) {
      throw error;
    }
  } else {
    return new Promise((resolve, reject) => {
      let reqObj;

      if (window.XMLHttpRequest) {
        reqObj = new XMLHttpRequest();
      } else {
        reqObj = new window.ActiveXObject("Microsoft.XMLHTTP");
      }
      reqObj.withCredentials = true;
      reqObj.open(type, url, true);
      reqObj.setRequestHeader(
        "Content-type",
        "application/x-www-form-urlencoded"
      );
      reqObj.send(sendData);

      reqObj.onreadystatechange = () => {
        if (reqObj.readyState === 4) {
          if (reqObj.status === 200) {
            let res = reqObj.response;
            if (typeof res !== "object") {
              res = JSON.parse(res);
            }
            resolve(res);
          } else {
            reject(reqObj);
          }
        }
      };
    });
  }
}
