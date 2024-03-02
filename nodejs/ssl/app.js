const https = require("https");
const httpProxy = require("http-proxy");
const url = require("url");
const fs = require("fs");

// * Yönlendirme yapılacak sunucunun adresi ve portu
const targetHost = "example.com";
const targetPort = 443;

// * HTTP proxy sunucusu
const proxy = httpProxy.createProxyServer({});

// * HTTPS sunucusu
const server = https.createServer(
  {
    // * SSL sertifikası ve anahtarı
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/cert.pem"),
  },
  function (req, res) {
    // * Yönlendirme işlemini gerçekleştirme
    const targetUrl = url.parse(
      `https://${targetHost}:${targetPort}${req.url}`
    );
    req.headers.host = targetHost;
    proxy.web(req, res, { target: targetUrl.href });
  }
);

// * Sunucu başlatma
server.listen(443, function () {
  console.log("HTTPS sunucusu çalışıyor: https://localhost:443");
});
