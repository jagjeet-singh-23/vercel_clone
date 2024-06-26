Here's what each part does:

1. **Dependencies and Constants:**

   - We import the `express` and `http-proxy` modules.
   - Define the `PORT` (8000) and `BASE_URL` (defaulting to "http://localhost:3000").

2. **Create Express App:**

   - We create an Express app using `express()`.
   - This app will handle incoming HTTP requests.

3. **Create HTTP Proxy:**

   - We create an instance of an HTTP proxy using `http-proxy.createProxy()`.
   - This proxy will forward requests to the appropriate target based on the subdomain.

4. **Middleware for Handling Requests:**

   - The middleware function (`app.use`) is executed for every incoming request.
   - It extracts the subdomain from the request's hostname.
   - Determines the target URL by appending the subdomain to the `BASE_URL`.
   - Proxies the request to the resolved target using `proxy.web()`.

5. **Middleware for Modifying Proxy Requests:**

   - The `proxy.on("preRequest")` event handler is called before sending the request to the target.
   - If the requested URL is "/", it modifies the proxy request path to include "index.html".

6. **Start the Server:**
   - The Express app listens on the specified `PORT`.
   - A message is logged to the console when the server starts.
