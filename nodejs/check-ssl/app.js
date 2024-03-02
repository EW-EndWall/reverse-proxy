const https = require("https");
const httpProxy = require("http-proxy");
const fs = require("fs");

// * Yönlendirme yapılacak sunucunun adresi ve portu
const target = {
  host: "example.com",
  port: 443,
  path: "/path/to/ca_bundle.crt",
};

// * SSL sertifikası kontrolü
const sslOptions = {
  rejectUnauthorized: true, // * Sertifika doğrulama işlemini yap
  ca: fs.readFileSync(target.path), // * Kök sertifikayı oku
};

// * HTTP proxy oluşturma
const proxy = httpProxy.createProxyServer({
  target: `https://${target.host}:${target.port}`,
  secure: true,
  ssl: sslOptions,
});

// * Sunucu oluşturma
https
  .createServer(sslOptions, (req, res) => {
    // * HTTP isteğinin yönlendirme işlemini gerçekleştirme
    proxy.web(req, res, (err) => {
      // * İstek hata verdi, hatayı istemciye gönderme
      res.writeHead(500, {
        "Content-Type": "text/plain",
      });
      res.end(`Error: ${err}`);
    });
  })
  .listen(443);
