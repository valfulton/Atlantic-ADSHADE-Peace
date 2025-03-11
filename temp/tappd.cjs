var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/tappd.ts
var tappd_exports = {};
__export(tappd_exports, {
  TappdClient: () => TappdClient,
  send_rpc_request: () => send_rpc_request,
  to_hex: () => to_hex
});
module.exports = __toCommonJS(tappd_exports);
var import_net = __toESM(require("net"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_http = __toESM(require("http"), 1);
var import_https = __toESM(require("https"), 1);
var import_url = require("url");
function to_hex(data) {
  if (typeof data === "string") {
    return Buffer.from(data).toString("hex");
  }
  if (data instanceof Uint8Array) {
    return Buffer.from(data).toString("hex");
  }
  return data.toString("hex");
}
function x509key_to_uint8array(pem, max_length) {
  const content = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
  const binaryDer = atob(content);
  if (!max_length) {
    max_length = binaryDer.length;
  }
  const result = new Uint8Array(max_length);
  for (let i = 0; i < max_length; i++) {
    result[i] = binaryDer.charCodeAt(i);
  }
  return result;
}
function replay_rtmr(history) {
  const INIT_MR = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  if (history.length === 0) {
    return INIT_MR;
  }
  let mr = Buffer.from(INIT_MR, "hex");
  for (const content of history) {
    let contentBuffer = Buffer.from(content, "hex");
    if (contentBuffer.length < 48) {
      const padding = Buffer.alloc(48 - contentBuffer.length, 0);
      contentBuffer = Buffer.concat([contentBuffer, padding]);
    }
    mr = import_crypto.default.createHash("sha384").update(Buffer.concat([mr, contentBuffer])).digest();
  }
  return mr.toString("hex");
}
function reply_rtmrs(event_log) {
  const rtmrs = [];
  for (let idx = 0; idx < 4; idx++) {
    const history = event_log.filter((event) => event.imr === idx).map((event) => event.digest);
    rtmrs[idx] = replay_rtmr(history);
  }
  return rtmrs;
}
function send_rpc_request(endpoint, path, payload) {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
      reject(new Error("Request timed out"));
    }, 3e4);
    const isHttp = endpoint.startsWith("http://") || endpoint.startsWith("https://");
    if (isHttp) {
      const url = new import_url.URL(path, endpoint);
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      };
      const req = (url.protocol === "https:" ? import_https.default : import_http.default).request(
        url,
        options,
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            clearTimeout(timeout);
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (error) {
              reject(new Error("Failed to parse response"));
            }
          });
        }
      );
      req.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      abortController.signal.addEventListener("abort", () => {
        req.destroy();
        reject(new Error("Request aborted"));
      });
      req.write(payload);
      req.end();
    } else {
      const client = import_net.default.createConnection({ path: endpoint }, () => {
        client.write(`POST ${path} HTTP/1.1\r
`);
        client.write(`Host: localhost\r
`);
        client.write(`Content-Type: application/json\r
`);
        client.write(`Content-Length: ${payload.length}\r
`);
        client.write("\r\n");
        client.write(payload);
      });
      let data = "";
      let headers = {};
      let headersParsed = false;
      let contentLength = 0;
      let bodyData = "";
      client.on("data", (chunk) => {
        data += chunk;
        if (!headersParsed) {
          const headerEndIndex = data.indexOf("\r\n\r\n");
          if (headerEndIndex !== -1) {
            const headerLines = data.slice(0, headerEndIndex).split("\r\n");
            headerLines.forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) {
                headers[key.toLowerCase()] = value;
              }
            });
            headersParsed = true;
            contentLength = parseInt(
              headers["content-length"] || "0",
              10
            );
            bodyData = data.slice(headerEndIndex + 4);
          }
        } else {
          bodyData += chunk;
        }
        if (headersParsed && bodyData.length >= contentLength) {
          client.end();
        }
      });
      client.on("end", () => {
        clearTimeout(timeout);
        try {
          const result = JSON.parse(bodyData.slice(0, contentLength));
          resolve(result);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      });
      client.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      abortController.signal.addEventListener("abort", () => {
        client.destroy();
        reject(new Error("Request aborted"));
      });
    }
  });
}
var TappdClient = class {
  endpoint;
  constructor(endpoint = "/var/run/tappd.sock") {
    if (process.env.DSTACK_SIMULATOR_ENDPOINT) {
      console.debug(
        `Using simulator endpoint: ${process.env.DSTACK_SIMULATOR_ENDPOINT}`
      );
      endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
    }
    this.endpoint = endpoint;
  }
  async getInfo() {
    const result = await send_rpc_request(
      this.endpoint,
      "/prpc/Tappd.Info",
      ""
    );
    return result;
  }
  async deriveKey(path, subject, alt_names) {
    let raw = {
      path: path || "",
      subject: subject || path || ""
    };
    if (alt_names && alt_names.length) {
      raw["alt_names"] = alt_names;
    }
    const payload = JSON.stringify(raw);
    const result = await send_rpc_request(
      this.endpoint,
      "/prpc/Tappd.DeriveKey",
      payload
    );
    Object.defineProperty(result, "asUint8Array", {
      get: () => (length) => x509key_to_uint8array(result.key, length),
      enumerable: true,
      configurable: false
    });
    return Object.freeze(result);
  }
  async tdxQuote(report_data, hash_algorithm) {
    let hex = to_hex(report_data);
    if (hash_algorithm === "raw") {
      if (hex.length > 128) {
        throw new Error(
          `Report data is too large, it should less then 64 bytes when hash_algorithm is raw.`
        );
      }
      if (hex.length < 128) {
        hex = hex.padStart(128, "0");
      }
    }
    const payload = JSON.stringify({ report_data: hex, hash_algorithm });
    const result = await send_rpc_request(
      this.endpoint,
      "/prpc/Tappd.TdxQuote",
      payload
    );
    if ("error" in result) {
      const err = result["error"];
      throw new Error(err);
    }
    Object.defineProperty(result, "replayRtmrs", {
      get: () => () => reply_rtmrs(JSON.parse(result.event_log)),
      enumerable: true,
      configurable: false
    });
    return Object.freeze(result);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TappdClient,
  send_rpc_request,
  to_hex
});
