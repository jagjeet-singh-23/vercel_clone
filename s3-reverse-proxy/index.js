const express = require("express");
const httpProxy = require("http-proxy");

// Create an Express app
const app = express();
const PORT = 8000;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// BASE_URL: bucket -> index.html -> object url
// https://<bucket-name>.s3.<region>.amazonaws.com/__outputs/

// Create an HTTP proxy instance
const proxy = httpProxy.createProxy();

// Middleware to handle incoming requests
app.use((req, res) => {
  // Extract the hostname and subdomain from the request
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];

  // Determine the target URL for the proxy
  const resolvesTo = `${BASE_URL}/${subdomain}`;

  // Proxy the request to the resolved target
  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

// Middleware to modify the proxy request
proxy.on("preRequest", function (proxyReq, req, res) {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Reverse Proxy Server is running on port ${PORT}`);
});
