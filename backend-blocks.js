(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('Backend Connection requires a Scratch-compatible extension runtime.');
  }

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const headerNamePattern = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  const requestTimeout = 15000;

  const validURL = (value) => {
    try {
      const url = new URL(String(value).trim());
      return !url.username && !url.password && (
        url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
      );
    } catch (error) {
      return false;
    }
  };

  const valueToText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '';
      }
    }
    return String(value);
  };

  class BackendBlocks {
    constructor() {
      this.headers = Object.create(null);
      this.response = '';
      this.status = 0;
      this.success = false;
      this.error = '';
    }

    getInfo() {
      return {
        id: 'backendconnection',
        name: 'Backend Connection',
        color1: '#168A78',
        color2: '#117565',
        color3: '#0B5A4E',
        blocks: [
          {
            opcode: 'request',
            blockType: Scratch.BlockType.COMMAND,
            text: 'send [METHOD] request to [URL] body [BODY]',
            arguments: {
              METHOD: { type: Scratch.ArgumentType.STRING, menu: 'methods', defaultValue: 'GET' },
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com/api' },
              BODY: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'setHeader',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set request header [NAME] to [VALUE]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Content-Type' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'application/json' }
            }
          },
          {
            opcode: 'clearHeaders',
            blockType: Scratch.BlockType.COMMAND,
            text: 'clear request headers'
          },
          {
            opcode: 'getResponse',
            blockType: Scratch.BlockType.REPORTER,
            text: 'backend response'
          },
          {
            opcode: 'getStatus',
            blockType: Scratch.BlockType.REPORTER,
            text: 'backend status code'
          },
          {
            opcode: 'getSuccess',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'backend request succeeded?'
          },
          {
            opcode: 'getJSONField',
            blockType: Scratch.BlockType.REPORTER,
            text: 'backend JSON field [PATH]',
            arguments: {
              PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'message' }
            }
          },
          {
            opcode: 'getError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'backend error'
          }
        ],
        menus: {
          methods: {
            acceptReporters: false,
            items: methods
          }
        }
      };
    }

    setHeader(args) {
      const name = String(args.NAME ?? '').trim();
      const value = String(args.VALUE ?? '');
      if (!headerNamePattern.test(name) || /[\r\n]/.test(value)) {
        this.error = 'Invalid HTTP header name or value.';
        return;
      }
      this.headers[name] = value;
      this.error = '';
    }

    clearHeaders() {
      this.headers = Object.create(null);
      this.error = '';
    }

    getResponse() {
      return this.response;
    }

    getStatus() {
      return this.status;
    }

    getSuccess() {
      return this.success;
    }

    getError() {
      return this.error;
    }

    getJSONField(args) {
      try {
        const path = String(args.PATH ?? '').trim().split('.').filter(Boolean);
        let value = JSON.parse(this.response);
        for (const key of path) {
          if (key === '__proto__' || key === 'prototype' || key === 'constructor' || value == null) return '';
          value = value[key];
        }
        return valueToText(value);
      } catch (error) {
        return '';
      }
    }

    async request(args) {
      const url = String(args.URL ?? '').trim();
      const method = String(args.METHOD ?? 'GET').toUpperCase();
      const body = String(args.BODY ?? '');
      this.response = '';
      this.status = 0;
      this.success = false;
      this.error = '';

      if (!methods.includes(method)) {
        this.error = 'Unsupported HTTP method.';
        return;
      }
      if (!validURL(url)) {
        this.error = 'Use an HTTPS URL, or HTTP on localhost.';
        return;
      }
      if ((method === 'GET' || method === 'DELETE') && body) {
        if (method === 'GET') {
          this.error = 'GET requests cannot include a body.';
          return;
        }
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeout);
      try {
        const options = {
          method,
          headers: { ...this.headers },
          signal: controller.signal
        };
        if (method !== 'GET' && body) options.body = body;
        const response = await fetch(url, options);
        this.status = response.status;
        this.success = response.ok;
        this.response = await response.text();
        if (!response.ok) this.error = `HTTP ${response.status}`;
      } catch (error) {
        this.error = error?.name === 'AbortError'
          ? 'Request timed out.'
          : `Request failed: ${error?.message || String(error)}. Check the URL and backend CORS settings.`;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  Scratch.extensions.register(new BackendBlocks());
})(Scratch);
