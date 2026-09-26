(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('WebSocket Blocks requires a Scratch-compatible extension runtime.');
  }

  const validURL = (value) => {
    try {
      const url = new URL(String(value).trim());
      return !url.username && !url.password && (
        url.protocol === 'wss:' ||
        (url.protocol === 'ws:' && ['localhost', '127.0.0.1'].includes(url.hostname))
      );
    } catch (error) {
      return false;
    }
  };

  class WebSocketBlocks {
    constructor() {
      this.socket = null;
      this.state = 'disconnected';
      this.message = '';
      this.error = '';
    }

    getInfo() {
      return {
        id: 'websocketblocks',
        name: 'WebSocket',
        color1: '#3973AC',
        color2: '#2D6093',
        color3: '#234C78',
        blocks: [
          {
            opcode: 'connect',
            blockType: Scratch.BlockType.COMMAND,
            text: 'connect WebSocket to [URL]',
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'wss://example.com/socket' }
            }
          },
          {
            opcode: 'send',
            blockType: Scratch.BlockType.COMMAND,
            text: 'send WebSocket message [MESSAGE]',
            arguments: {
              MESSAGE: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello server' }
            }
          },
          {
            opcode: 'disconnect',
            blockType: Scratch.BlockType.COMMAND,
            text: 'disconnect WebSocket'
          },
          {
            opcode: 'whenConnected',
            blockType: Scratch.BlockType.HAT,
            text: 'when WebSocket connects'
          },
          {
            opcode: 'whenMessage',
            blockType: Scratch.BlockType.HAT,
            text: 'when WebSocket message received'
          },
          {
            opcode: 'whenDisconnected',
            blockType: Scratch.BlockType.HAT,
            text: 'when WebSocket disconnects'
          },
          {
            opcode: 'whenError',
            blockType: Scratch.BlockType.HAT,
            text: 'when WebSocket errors'
          },
          {
            opcode: 'isConnected',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'WebSocket connected?'
          },
          {
            opcode: 'getState',
            blockType: Scratch.BlockType.REPORTER,
            text: 'WebSocket state'
          },
          {
            opcode: 'getMessage',
            blockType: Scratch.BlockType.REPORTER,
            text: 'last WebSocket message'
          },
          {
            opcode: 'getError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'WebSocket error'
          }
        ]
      };
    }

    startHats(opcode) {
      const runtime = Scratch.vm?.runtime;
      if (runtime && typeof runtime.startHats === 'function') {
        runtime.startHats(`websocketblocks_${opcode}`);
      }
    }

    whenConnected() {
      return true;
    }

    whenMessage() {
      return true;
    }

    whenDisconnected() {
      return true;
    }

    whenError() {
      return true;
    }

    connect(args) {
      const url = String(args.URL ?? '').trim();
      const WebSocketClass = globalThis.WebSocket;
      if (!validURL(url)) {
        this.state = 'error';
        this.error = 'Use a WSS URL, or WS on localhost.';
        this.startHats('whenError');
        return;
      }
      if (typeof WebSocketClass !== 'function') {
        this.state = 'error';
        this.error = 'WebSocket is unavailable in this extension runtime.';
        this.startHats('whenError');
        return;
      }

      if (this.socket && this.socket.readyState < WebSocketClass.CLOSING) {
        this.socket.close(1000, 'Reconnecting');
      }

      try {
        const socket = new WebSocketClass(url);
        this.socket = socket;
        this.state = 'connecting';
        this.error = '';

        socket.addEventListener('open', () => {
          if (this.socket !== socket) return;
          this.state = 'connected';
          this.startHats('whenConnected');
        });
        socket.addEventListener('message', async (event) => {
          if (this.socket !== socket) return;
          try {
            this.message = typeof event.data === 'string'
              ? event.data
              : typeof Blob !== 'undefined' && event.data instanceof Blob
                ? await event.data.text()
                : String(event.data);
          } catch (error) {
            this.message = String(event.data);
          }
          this.startHats('whenMessage');
        });
        socket.addEventListener('error', () => {
          if (this.socket !== socket) return;
          this.error = 'WebSocket connection error.';
          this.startHats('whenError');
        });
        socket.addEventListener('close', (event) => {
          if (this.socket !== socket) return;
          this.state = 'disconnected';
          if (event.code !== 1000 && !this.error) this.error = `WebSocket closed (${event.code}).`;
          this.startHats('whenDisconnected');
        });
      } catch (error) {
        this.state = 'error';
        this.error = error?.message || String(error);
        this.startHats('whenError');
      }
    }

    send(args) {
      const WebSocketClass = globalThis.WebSocket;
      if (!this.socket || !WebSocketClass || this.socket.readyState !== WebSocketClass.OPEN) {
        this.error = 'WebSocket is not connected.';
        return;
      }
      try {
        this.socket.send(String(args.MESSAGE ?? ''));
        this.error = '';
      } catch (error) {
        this.error = error?.message || String(error);
        this.startHats('whenError');
      }
    }

    disconnect() {
      if (!this.socket) {
        this.state = 'disconnected';
        return;
      }
      const WebSocketClass = globalThis.WebSocket;
      if (WebSocketClass && this.socket.readyState < WebSocketClass.CLOSING) {
        this.state = 'disconnecting';
        this.socket.close(1000, 'Disconnected by project');
      }
    }

    isConnected() {
      const WebSocketClass = globalThis.WebSocket;
      return Boolean(this.socket && WebSocketClass && this.socket.readyState === WebSocketClass.OPEN);
    }

    getState() {
      return this.state;
    }

    getMessage() {
      return this.message;
    }

    getError() {
      return this.error;
    }
  }

  Scratch.extensions.register(new WebSocketBlocks());
})(Scratch);
