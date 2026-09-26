(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('JavaScript Blocks requires a Scratch-compatible extension runtime.');
  }

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const cleanText = (value) => String(value ?? '').trim();

  const allowedScriptURL = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
    } catch (error) {
      return false;
    }
  };

  const resultToText = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return String(value);
      }
    }
    return String(value);
  };

  class JavaScriptBlocks {
    constructor() {
      this.lastResult = '';
      this.lastError = '';
    }

    getInfo() {
      return {
        id: 'javascriptblocks',
        name: 'JavaScript Blocks',
        color1: '#D4A017',
        color2: '#B8890F',
        color3: '#8F6A09',
        blocks: [
          {
            opcode: 'runCode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'run JavaScript [CODE]',
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "console.log('Hello from JavaScript!');"
              }
            }
          },
          {
            opcode: 'importCode',
            blockType: Scratch.BlockType.COMMAND,
            text: 'import and run JavaScript from [URL]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com/script.js'
              }
            }
          },
          {
            opcode: 'stringLiteral',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript string [TEXT]',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          },
          {
            opcode: 'numberLiteral',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript number [NUMBER]',
            arguments: {
              NUMBER: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
            }
          },
          {
            opcode: 'booleanLiteral',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript boolean [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.BOOLEAN, defaultValue: false }
            }
          },
          {
            opcode: 'arrayLiteral',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript array [ITEMS]',
            arguments: {
              ITEMS: { type: Scratch.ArgumentType.STRING, defaultValue: '1, 2, 3' }
            }
          },
          {
            opcode: 'objectField',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript field [KEY] value [VALUE]',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'name' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "'Sprite'" }
            }
          },
          {
            opcode: 'joinCode',
            blockType: Scratch.BlockType.REPORTER,
            text: 'join JavaScript [FIRST] [SECOND]',
            arguments: {
              FIRST: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
              SECOND: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'returnCode',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript return [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '10 + 5' }
            }
          },
          {
            opcode: 'getResult',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript result'
          },
          {
            opcode: 'getError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JavaScript error'
          }
        ]
      };
    }

    getResult() {
      return this.lastResult;
    }

    getError() {
      return this.lastError;
    }

    stringLiteral(args) {
      return JSON.stringify(String(args.TEXT ?? ''));
    }

    numberLiteral(args) {
      const number = Number(args.NUMBER);
      return Number.isFinite(number) ? String(number) : '0';
    }

    booleanLiteral(args) {
      const value = args.VALUE;
      return value === true || value === 1 || String(value).toLowerCase() === 'true' ? 'true' : 'false';
    }

    arrayLiteral(args) {
      return `[${args.ITEMS}]`;
    }

    objectField(args) {
      return `${JSON.stringify(String(args.KEY ?? ''))}: ${args.VALUE}`;
    }

    joinCode(args) {
      return `${args.FIRST}${args.SECOND}`;
    }

    returnCode(args) {
      return `return ${args.VALUE};`;
    }

    async runCode(args) {
      return this.execute(cleanText(args.CODE));
    }

    async importCode(args) {
      const url = cleanText(args.URL);
      if (!allowedScriptURL(url)) {
        this.lastError = 'Use an HTTPS URL, or HTTP on localhost.';
        this.lastResult = '';
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const code = await response.text();
        await this.execute(code);
      } catch (error) {
        this.lastError = `Could not import script: ${error?.message || String(error)}`;
        this.lastResult = '';
      }
    }

    async execute(code) {
      if (!Scratch.extensions.unsandboxed) {
        this.lastError = 'Load this extension with unsandboxed access to run JavaScript.';
        this.lastResult = '';
        return;
      }

      try {
        const run = new AsyncFunction('Scratch', 'vm', 'runtime', 'args', `"use strict";\n${code}`);
        const value = await run(Scratch, Scratch.vm, Scratch.vm?.runtime, {});
        this.lastResult = resultToText(value);
        this.lastError = '';
      } catch (error) {
        this.lastResult = '';
        this.lastError = error?.message || String(error);
      }
    }
  }

  Scratch.extensions.register(new JavaScriptBlocks());
})(Scratch);
