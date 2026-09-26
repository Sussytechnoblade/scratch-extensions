# PenguinMod JSON Blocks

This extension provides reporter blocks for composing JSON, checking it, formatting it, and reading nested values. Its reporter inputs connect to variables and other reporters.

## Blocks

- `is valid JSON` checks whether input parses.
- `JSON value at [PATH] in [JSON]` reads a nested field using dot notation, such as `player.name` or `items.0`.
- `format JSON` pretty-prints valid JSON.
- `JSON string`, `JSON number`, and `JSON boolean` make JSON values.
- `JSON field`, `JSON array`, `JSON object`, and `join JSON` compose JSON fragments.

For example, plug `JSON string` and `JSON number` into `JSON field`, then use `JSON object` to wrap the field. The result can connect to a backend request body or a Save Data value. Fragment blocks accept JSON source text, so use the value blocks to quote strings and avoid malformed JSON.

Host `json-blocks.js` at a URL PenguinMod can access and load it as a custom extension.
