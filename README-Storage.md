# PenguinMod Save Data Blocks

This extension saves and loads text using browser local storage.

## Blocks

- `save [VALUE] as [KEY]` saves a value under a key.
- `load data [KEY] or [DEFAULT]` returns the saved value or the fallback if no value exists.
- `saved data [KEY] exists?` checks for a saved key.
- `delete saved data [KEY]` removes one key.
- `clear all Save Data keys` removes only keys created by this extension.
- `save data error` reports the latest storage error.

Data persists in the browser for the current website origin, not inside the project file. Keys are namespaced so clearing this extension's data does not remove other site storage. Storage is limited by the browser and can be cleared by the user. Use JSON Blocks to save structured values.

Host `storage-blocks.js` at a URL PenguinMod can access and load it as a custom extension. Do not store passwords, API keys, or other secrets in browser storage.
