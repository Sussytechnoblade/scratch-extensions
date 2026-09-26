# PenguinMod Backend Connection

This custom extension lets a Scratch/PenguinMod project send HTTP requests to a backend you control and read the response.

## Blocks

- `send [METHOD] request to [URL] body [BODY]` sends a GET, POST, PUT, PATCH, or DELETE request.
- `set request header [NAME] to [VALUE]` adds a header for subsequent requests, for example `Content-Type: application/json` or `Authorization: Bearer ...`.
- `clear request headers` removes the stored headers.
- `backend response`, `backend status code`, and `backend request succeeded?` report the latest response.
- `backend JSON field [PATH]` reads a JSON property using a dot path, such as `data.user.name`.
- `backend error` reports a URL, timeout, network, or HTTP error.

Request URL, body, header name, and header value inputs accept Scratch variables and reporter blocks. GET requests cannot include a body. Responses are returned as text; set the appropriate request headers in your project when sending JSON.

## Requirements

Host `backend-blocks.js` at a URL PenguinMod can access, then load it as a custom extension. Use HTTPS for remote backends; plain HTTP is allowed only for localhost during development. The backend must allow browser requests from PenguinMod with CORS headers. Requests with custom headers or JSON content types commonly require a successful CORS preflight (`OPTIONS`).

This extension does not provide or connect to a GitHub Copilot/OpenAI backend automatically. Enter the URL of your own API. Never put long-lived private credentials in a project you plan to publish: project users can inspect extension inputs and network requests. For public projects, put secrets on your own server and have the extension call that server instead.
