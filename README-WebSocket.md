# PenguinMod WebSocket Blocks

This extension connects a project to a WebSocket server for real-time messages.

## Blocks

- `connect WebSocket to [URL]` starts a connection.
- `send WebSocket message [MESSAGE]` sends text when connected.
- `disconnect WebSocket` closes the connection.
- Event hats run when the socket connects, receives a message, disconnects, or errors.
- `last WebSocket message`, `WebSocket connected?`, `WebSocket state`, and `WebSocket error` report its current data and state.

Connect the message reporter to a variable or another Scratch block inside the message-received hat. Use a `wss://` address for remote servers; plain `ws://` is allowed only for localhost development. The server must be configured to accept connections from the project's origin and should authenticate users where needed. WebSocket connections do not use the browser's CORS preflight mechanism. This extension does not automatically reconnect after a dropped connection.

Host `websocket-blocks.js` at a URL PenguinMod can access and load it as a custom extension.
