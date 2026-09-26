(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('Save Data Blocks requires a Scratch-compatible extension runtime.');
  }

  const PREFIX = 'penguinmod-save-data:';

  class StorageBlocks {
    constructor() {
      this.error = '';
    }

    getInfo() {
      return {
        id: 'savedatablocks',
        name: 'Save Data',
        color1: '#518A47',
        color2: '#42763A',
        color3: '#345F2E',
        blocks: [
          {
            opcode: 'saveData',
            blockType: Scratch.BlockType.COMMAND,
            text: 'save [VALUE] as [KEY]',
            arguments: {
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'score data' },
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'save1' }
            }
          },
          {
            opcode: 'loadData',
            blockType: Scratch.BlockType.REPORTER,
            text: 'load data [KEY] or [DEFAULT]',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'save1' },
              DEFAULT: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'hasData',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'saved data [KEY] exists?',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'save1' }
            }
          },
          {
            opcode: 'deleteData',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete saved data [KEY]',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'save1' }
            }
          },
          {
            opcode: 'clearData',
            blockType: Scratch.BlockType.COMMAND,
            text: 'clear all Save Data keys'
          },
          {
            opcode: 'getError',
            blockType: Scratch.BlockType.REPORTER,
            text: 'save data error'
          }
        ]
      };
    }

    getStorage() {
      try {
        const storage = globalThis.localStorage;
        if (!storage) throw new Error('Browser storage is unavailable.');
        return storage;
      } catch (error) {
        this.error = error?.message || 'Browser storage is unavailable.';
        return null;
      }
    }

    fullKey(key) {
      return `${PREFIX}${String(key ?? '')}`;
    }

    getError() {
      return this.error;
    }

    saveData(args) {
      const storage = this.getStorage();
      if (!storage) return;
      try {
        storage.setItem(this.fullKey(args.KEY), String(args.VALUE ?? ''));
        this.error = '';
      } catch (error) {
        this.error = error?.message || String(error);
      }
    }

    loadData(args) {
      const fallback = String(args.DEFAULT ?? '');
      const storage = this.getStorage();
      if (!storage) return fallback;
      try {
        const value = storage.getItem(this.fullKey(args.KEY));
        this.error = '';
        return value === null ? fallback : value;
      } catch (error) {
        this.error = error?.message || String(error);
        return fallback;
      }
    }

    hasData(args) {
      const storage = this.getStorage();
      if (!storage) return false;
      try {
        const found = storage.getItem(this.fullKey(args.KEY)) !== null;
        this.error = '';
        return found;
      } catch (error) {
        this.error = error?.message || String(error);
        return false;
      }
    }

    deleteData(args) {
      const storage = this.getStorage();
      if (!storage) return;
      try {
        storage.removeItem(this.fullKey(args.KEY));
        this.error = '';
      } catch (error) {
        this.error = error?.message || String(error);
      }
    }

    clearData() {
      const storage = this.getStorage();
      if (!storage) return;
      try {
        const keys = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key && key.startsWith(PREFIX)) keys.push(key);
        }
        for (const key of keys) storage.removeItem(key);
        this.error = '';
      } catch (error) {
        this.error = error?.message || String(error);
      }
    }
  }

  Scratch.extensions.register(new StorageBlocks());
})(Scratch);
