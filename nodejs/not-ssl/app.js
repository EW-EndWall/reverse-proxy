const http = require("http");

// * Yönlendirme yapılacak sunucunun adresi ve portu
const targetIp = "example.com";
const targetPort = "80";

const server = http.createServer((req, res) => {
  // * Gelen isteğin yönlendirme işlemini gerçekleştirme
  const proxyReq = http.request(
    {
      host: targetIp,
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: Object.assign({}, req.headers, {
        host: `${targetIp}:${targetPort}`,
      }),
    },
    (proxyRes) => {
      // * Yönlendirilen isteğin yanıtını istemciye geri dönme
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  req.pipe(proxyReq);
});

server.listen(80);
