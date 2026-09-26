(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('JSON Blocks requires a Scratch-compatible extension runtime.');
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return value === null ? 'null' : '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return '';
      }
    }
    return String(value);
  };

  class JSONBlocks {
    getInfo() {
      return {
        id: 'jsonblocks',
        name: 'JSON Blocks',
        color1: '#3973AC',
        color2: '#2D6093',
        color3: '#234C78',
        blocks: [
          {
            opcode: 'jsonValid',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is valid JSON [JSON]?',
            arguments: {
              JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '{"score": 10}' }
            }
          },
          {
            opcode: 'jsonGet',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON value at [PATH] in [JSON]',
            arguments: {
              PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' },
              JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '{"score": 10}' }
            }
          },
          {
            opcode: 'jsonFormat',
            blockType: Scratch.BlockType.REPORTER,
            text: 'format JSON [JSON]',
            arguments: {
              JSON: { type: Scratch.ArgumentType.STRING, defaultValue: '{"score":10}' }
            }
          },
          {
            opcode: 'jsonString',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON string [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          },
          {
            opcode: 'jsonNumber',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON number [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
            }
          },
          {
            opcode: 'jsonBoolean',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON boolean [VALUE]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.BOOLEAN, defaultValue: false }
            }
          },
          {
            opcode: 'jsonField',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON field [KEY] value [VALUE]',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '10' }
            }
          },
          {
            opcode: 'jsonArray',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON array items [ITEMS]',
            arguments: {
              ITEMS: { type: Scratch.ArgumentType.STRING, defaultValue: '1, 2, 3' }
            }
          },
          {
            opcode: 'jsonObject',
            blockType: Scratch.BlockType.REPORTER,
            text: 'JSON object fields [FIELDS]',
            arguments: {
              FIELDS: { type: Scratch.ArgumentType.STRING, defaultValue: '"score": 10' }
            }
          },
          {
            opcode: 'jsonJoin',
            blockType: Scratch.BlockType.REPORTER,
            text: 'join JSON [FIRST] [SECOND]',
            arguments: {
              FIRST: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
              SECOND: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          }
        ]
      };
    }

    jsonValid(args) {
      try {
        JSON.parse(String(args.JSON));
        return true;
      } catch (error) {
        return false;
      }
    }

    jsonGet(args) {
      try {
        const path = String(args.PATH ?? '').trim().split('.').filter(Boolean);
        let value = JSON.parse(String(args.JSON));
        for (const key of path) {
          if (key === '__proto__' || key === 'prototype' || key === 'constructor' || value == null) return '';
          value = value[key];
        }
        return formatValue(value);
      } catch (error) {
        return '';
      }
    }

    jsonFormat(args) {
      try {
        return JSON.stringify(JSON.parse(String(args.JSON)), null, 2);
      } catch (error) {
        return '';
      }
    }

    jsonString(args) {
      return JSON.stringify(String(args.VALUE ?? ''));
    }

    jsonNumber(args) {
      const number = Number(args.VALUE);
      return Number.isFinite(number) ? String(number) : '0';
    }

    jsonBoolean(args) {
      const value = args.VALUE;
      return value === true || value === 1 || String(value).toLowerCase() === 'true' ? 'true' : 'false';
    }

    jsonField(args) {
      return `${JSON.stringify(String(args.KEY ?? ''))}: ${args.VALUE}`;
    }

    jsonArray(args) {
      return `[${args.ITEMS}]`;
    }

    jsonObject(args) {
      return `{${args.FIELDS}}`;
    }

    jsonJoin(args) {
      return `${args.FIRST}${args.SECOND}`;
    }
  }

  Scratch.extensions.register(new JSONBlocks());
})(Scratch);
