import "dotenv/config";

import fs from "fs";

import Fastify from "fastify";

const fastify = Fastify({
  logger: process.env.FASTIFY_LOG === "true", // * is log
  trustProxy: true,
  // https: {
  //   key: fs.readFileSync("./cert/key.pem"), // * ssl key
  //   cert: fs.readFileSync("./cert/cert.pem"), // * ssl cert
  // },
});

import { createProxyMiddleware } from "http-proxy-middleware";

import proxyRouter from "./router.js";
import proxyAccess from "./access.js";

let dataStore = null;

const appLogCollector = async (logData) => {
  if (process.env.LOG_SAVE == true) {
    return;
  }
  return;
};

const proxyDataApi = async () => {
  try {
    const response = await fetch(process.env.PROXY_DATA_API, {
      headers: {
        Authorization: `Token ${process.env.PROXY_DATA_API_TOKEN}`,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    dataStore = data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

if (process.env.PROXY_DATA == "remote") {
  // * Run every 5 minutes
  proxyDataApi();
  setInterval(proxyDataApi, 5 * 60 * 1000);
}

const onProxyReq = (proxyReq, req, res) => {
  // * handle request
};

// * onProxyRes center
const onProxyRes = (proxyRes, req, res) => {
  // * handle respons
};

// * onError center
const onError = (err, req, res) => {
  // * handle error
  fastify.log.error("Proxy error:", err);

  res.writeHead(502);
  res.end(fs.readFileSync("502.html"));
};

// * create proxy middleware
const proxyconfig = (target) => {
  return {
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
  };
};

// * Middleware routing
fastify.addHook("onRequest", (req, reply) => {
  const hostName = req.headers.host;
  const routerTarget =
    process.env.PROXY_DATA == "remote"
      ? dataStore != null
        ? dataStore[hostName]
        : proxyRouter[hostName]
      : proxyRouter[hostName];
  fastify.log.info(`Request host ${hostName}`);

  if (routerTarget != undefined) {
    const target = `${routerTarget.ip}:${routerTarget.port}`;
    const proxy = async () => {
      await new Promise((resolve, reject) => {
        createProxyMiddleware(proxyconfig(target))(
          req.raw,
          reply.raw,
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    };

    // * is access public
    if (routerTarget.accessType == "public") {
      fastify.log.info(`Public host`);
      return proxy();
    }

    const reqIp = req.ip;
    const reqUser = "";

    if (
      proxyAccess.ip.some((e) => e == reqIp) ||
      proxyAccess.users.some((e) => e == reqUser)
    ) {
      fastify.log.info(`User access ip ${reqIp} user ${reqUser}`);
      return proxy();
    }

    // * is not access
    fastify.log.info(`Not access ip ${reqIp} user ${reqUser}`);
    return reply
      .status(500)
      .type("text/html")
      .send(fs.readFileSync("500.html"));
  }

  // * is not domain or ip
  fastify.log.info(`Unknown host ${hostName}`);
  return reply.status(500).type("text/html").send(fs.readFileSync("500.html"));
});

// * start server
const startProxyServer = () => {
  try {
    fastify.listen({
      port: process.env.PORT || 3000,
      host: process.env.HOST || "localhost",
    });
    fastify.log.info(`Proxy server is running on port ${process.env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startProxyServer();
