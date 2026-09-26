# PenguinMod HTML Blocks

A PenguinMod custom extension for building HTML with blocks and displaying it on the project stage.

## Blocks

- HTML reporter blocks create escaped text, attributes, elements, headings, paragraphs, links, images, inputs, styles, comments, and full documents. Use `combine HTML` to join fragments.
- `show HTML on stage` and `update stage HTML` render generated markup over the stage. `hide` and `clear` control the preview.
- Stage controls set the preview's position, size, background, text color, and font size.

All text, number, tag, URL, and content inputs use Scratch-compatible sockets, so variables and other reporter blocks can be connected. Reporter blocks can be nested inside other HTML blocks. Element content, attributes, CSS, and the document body are raw code so you can compose markup; use `HTML text` for plain text. Link and image helpers reject unsafe URL schemes. The void-element block accepts only standard void tags.

## Load in PenguinMod

Host `html-blocks.js` at a URL PenguinMod can access, then load it as a custom extension from the Extensions menu. Building HTML strings works in a sandboxed extension; showing it on the stage requires enabling the extension's unsandboxed access so it can use PenguinMod's stage overlay API.

For example, combine an `HTML attribute` block using `class` and `notice` with an `HTML text` block containing `Hello!`, then plug both into `HTML element` using the tag `p`. Connect that result to `show HTML on stage`:

```html
<p class="notice">Hello!</p>
```

The preview uses a shadow root to keep its CSS inside the preview. It renders the supplied HTML as live page content; only display HTML you trust. The `HTML document` block is for generating a complete document string, while the stage preview expects HTML fragments.