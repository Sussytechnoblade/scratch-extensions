# PenguinMod JavaScript Blocks

This custom extension adds blocks for executing JavaScript in a PenguinMod project.

## Blocks

- `run JavaScript [CODE]` executes code from the input. Connect a variable or text reporter to provide code dynamically.
- `import and run JavaScript from [URL]` fetches a script from HTTPS (or localhost HTTP) and executes it. The host must permit browser cross-origin requests (CORS).
- JavaScript snippet reporters create string literals, numbers, booleans, arrays, object fields, joined code, and `return` statements. Connect them to each other or to `run JavaScript [CODE]`.
- `JavaScript result` reports the last value returned by the code. Use `return value;` to provide a result.
- `JavaScript error` reports the most recent execution or import error, or an empty string when there is none.

Code can use `Scratch`, `vm`, and `runtime` as names. For example, `return 2 + 2;` makes `JavaScript result` report `4`.

Connect `JavaScript number (10)` into `JavaScript return`, then connect that reporter to `run JavaScript`. Connect `JavaScript result` to a regular Scratch `say` or `set variable` block. These reporter sockets can also take variables and reporters from other Scratch extensions.

## Loading and security

Host `javascript-blocks.js` at a URL PenguinMod can access and load it as an unsandboxed custom extension. The extension needs unsandboxed access to execute JavaScript in the project environment.

Running or importing JavaScript gives that code broad access to the page and project. Only run code you wrote or fully trust; a malicious script can access project data, modify the page, or send data over the network. Imported scripts are fetched and run as classic scripts, not ES modules, and may need to be hosted with CORS enabled. Never use this with code from an untrusted URL.
