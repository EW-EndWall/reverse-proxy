require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const https = require("https");
const fs = require("fs");

const app = express();

app.set("trust proxy", true);

const proxyRouter = require("./router.js");
const proxyAccess = require("./access.js");

const onProxyReq = (proxyReq, req, res) => {
  // * handle request
};

const onProxyRes = (proxyRes, req, res) => {
  // * handle response
};

const onError = (err, req, res) => {
  // * handle error
  res.writeHead(502);
  res.end(fs.readFileSync("502.html"));
};

const createTargetProxyMiddleware = (target) => {
  return createProxyMiddleware({
    target: target,
    changeOrigin: true, // ? When this is turned on, it does not see hosting - it changes the source of the host header to the target URL
    on: {
      proxyReq: onProxyReq,
      proxyRes: onProxyRes,
      error: onError,
    },
    secure: false,
    ws: true, // * websoket error fix
    // pathRewrite: { "^/api": "" }, // * Rewrite the incoming request when necessary
    // router: {
    // "localhost:3000": "http://localhost:5000",
    // },
  });
};

app.use((req, res, next) => {
  const hostName = req.headers.host;
  const routerTarget = proxyRouter[hostName];

  if (routerTarget != undefined) {
    const target = `${routerTarget.ip}:${routerTarget.port}`;

    // * is access public
    if (routerTarget.accessType == "public") {
      return createTargetProxyMiddleware(target)(req, res, next);
    }

    const reqIp = req.ip;
    const reqUser = "";

    if (
      proxyAccess.ip.some((e) => e == reqIp) ||
      proxyAccess.users.some((e) => e == reqUser)
    ) {
      return createTargetProxyMiddleware(target)(req, res, next);
    }

    // * is not access
    return res.status(500).type("text/html").send(fs.readFileSync("500.html"));
  }

  // * is not domain or ip
  return res.status(500).type("text/html").send(fs.readFileSync("500.html"));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

if (process.env.USE_HTTPS === "true") {
  const options = {
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/cert.pem"),
  };
  https.createServer(options, app).listen(PORT, HOST, () => {
    console.log(`HTTPS server running on https://${HOST}:${PORT}`);
  });
} else {
  app.listen(PORT, HOST, () => {
    console.log(`HTTP server running on http://${HOST}:${PORT}`);
  });
}
