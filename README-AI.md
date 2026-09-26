 PenguinMod AI Blocks

This extension adds one block, `open AI coding chat`, which opens a chat panel over the project stage. Ask questions about Scratch or PenguinMod projects; coding answers include copyable `scratchblocks` scripts.

## Setup

1. Host `ai-blocks.js` on a URL PenguinMod can access.
2. Load it as an unsandboxed custom extension so it can display the chat panel over the stage.
3. Drag `open AI coding chat` into the project and click it.
4. Open `AI provider settings` in the chat to enter the endpoint, model, and API key.

## Important notes

- The extension keeps the API key in memory only; it is not saved after the page reloads.
- The default endpoint is OpenAI-compatible: `https://api.openai.com/v1/chat/completions`.
- You need a real API key for the provider you choose.
- Some providers require different request formats; this version targets the OpenAI-compatible chat-completions API.
- The chat returns Scratch block scripts as text for you to recreate. It does not insert native, editable blocks into the project workspace.
- Do not publish a project with a personal API key embedded or shared. Browser-based keys can be inspected by project users; a private server proxy is safer for published projects.

## Example prompt

Click `open AI coding chat` and ask: `Make a Scratch script that moves 10 steps when the green flag is clicked.` The reply includes a fenced `scratchblocks` script, a short explanation, and block placement guidance.

The chat history and API key are cleared when the page reloads.

