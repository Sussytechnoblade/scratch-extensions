(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('HTML Blocks requires a Scratch-compatible extension runtime.');
  }

  const escapeHTML = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const validName = (value) => /^[A-Za-z][A-Za-z0-9:._-]*$/.test(String(value));
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr'
  ]);
  const inputTypes = new Set([
    'text', 'number', 'email', 'password', 'date', 'checkbox', 'url', 'range', 'color'
  ]);

  const safeURL = (value) => {
    const url = String(value).trim();
    const normalized = url.replace(/[\u0000-\u0020\u007f]/g, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(normalized) && !/^(https?|mailto|tel):/i.test(normalized)) return '';
    return url;
  };

  class HTMLBlocks {
    constructor() {
      this.overlay = null;
      this.content = null;
    }

    getInfo() {
      return {
        id: 'htmlblocks',
        name: 'HTML Blocks',
        color1: '#E34F26',
        color2: '#C93D1D',
        color3: '#A52A15',
        blocks: [
          {
            opcode: 'text',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML text [TEXT]',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello, world!' }
            }
          },
          {
            opcode: 'attribute',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML attribute [NAME] value [VALUE]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'class' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'example' }
            }
          },
          {
            opcode: 'element',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML element [TAG] attributes [ATTRIBUTES] content [CONTENT]',
            arguments: {
              TAG: { type: Scratch.ArgumentType.STRING, defaultValue: 'p' },
              ATTRIBUTES: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
              CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello!' }
            }
          },
          {
            opcode: 'voidElement',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML void element [TAG] attributes [ATTRIBUTES]',
            arguments: {
              TAG: { type: Scratch.ArgumentType.STRING, defaultValue: 'br' },
              ATTRIBUTES: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'heading',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML [LEVEL] heading [TEXT]',
            arguments: {
              LEVEL: { type: Scratch.ArgumentType.STRING, menu: 'headingLevels', defaultValue: 'h1' },
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'A heading' }
            }
          },
          {
            opcode: 'paragraph',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML paragraph [TEXT]',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'A paragraph' }
            }
          },
          {
            opcode: 'link',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML link URL [URL] text [TEXT]',
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com' },
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Visit website' }
            }
          },
          {
            opcode: 'image',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML image URL [URL] alt text [ALT]',
            arguments: {
              URL: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com/image.png' },
              ALT: { type: Scratch.ArgumentType.STRING, defaultValue: 'An image' }
            }
          },
          {
            opcode: 'input',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML input type [TYPE] placeholder [PLACEHOLDER]',
            arguments: {
              TYPE: { type: Scratch.ArgumentType.STRING, menu: 'inputTypes', defaultValue: 'text' },
              PLACEHOLDER: { type: Scratch.ArgumentType.STRING, defaultValue: 'Type here' }
            }
          },
          {
            opcode: 'style',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML style [CSS]',
            arguments: {
              CSS: { type: Scratch.ArgumentType.STRING, defaultValue: 'p { color: red; }' }
            }
          },
          {
            opcode: 'comment',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML comment [TEXT]',
            arguments: {
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'A comment' }
            }
          },
          {
            opcode: 'combine',
            blockType: Scratch.BlockType.REPORTER,
            text: 'combine HTML [FIRST] [SECOND]',
            arguments: {
              FIRST: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
              SECOND: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'document',
            blockType: Scratch.BlockType.REPORTER,
            text: 'HTML document title [TITLE] body [BODY]',
            arguments: {
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: 'My page' },
              BODY: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
            }
          },
          {
            opcode: 'showHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'show HTML [HTML] on stage',
            arguments: {
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<h1>Hello!</h1>' }
            }
          },
          {
            opcode: 'updateHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'update stage HTML to [HTML]',
            arguments: {
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<p>Updated!</p>' }
            }
          },
          {
            opcode: 'hideHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'hide stage HTML'
          },
          {
            opcode: 'clearHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'clear stage HTML'
          },
          {
            opcode: 'setPosition',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set HTML position x [X] y [Y]',
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
            }
          },
          {
            opcode: 'setSize',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set HTML size width [WIDTH] height [HEIGHT]',
            arguments: {
              WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: 240 },
              HEIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 120 }
            }
          },
          {
            opcode: 'setBackground',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set HTML background [COLOR]',
            arguments: {
              COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: '#ffffff' }
            }
          },
          {
            opcode: 'setTextColor',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set HTML text color [COLOR]',
            arguments: {
              COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: '#222222' }
            }
          },
          {
            opcode: 'setFontSize',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set HTML font size [SIZE]',
            arguments: {
              SIZE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 18 }
            }
          }
        ],
        menus: {
          headingLevels: {
            acceptReporters: false,
            items: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
          },
          inputTypes: {
            acceptReporters: false,
            items: [...inputTypes]
          }
        }
      };
    }

    text(args) {
      return escapeHTML(args.TEXT);
    }

    attribute(args) {
      const name = String(args.NAME).trim();
      if (!validName(name)) return '';
      return `${name}="${escapeHTML(args.VALUE)}"`;
    }

    element(args) {
      const tag = String(args.TAG).trim();
      if (!validName(tag)) return '';
      const attributes = String(args.ATTRIBUTES).trim();
      const attributeText = attributes ? ` ${attributes}` : '';
      return `<${tag}${attributeText}>${args.CONTENT}</${tag}>`;
    }

    voidElement(args) {
      const tag = String(args.TAG).trim();
      if (!validName(tag) || !voidElements.has(tag.toLowerCase())) return '';
      const attributes = String(args.ATTRIBUTES).trim();
      const attributeText = attributes ? ` ${attributes}` : '';
      return `<${tag}${attributeText}>`;
    }

    heading(args) {
      const level = String(args.LEVEL).toLowerCase();
      if (!/^h[1-6]$/.test(level)) return '';
      return `<${level}>${escapeHTML(args.TEXT)}</${level}>`;
    }

    paragraph(args) {
      return `<p>${escapeHTML(args.TEXT)}</p>`;
    }

    link(args) {
      const url = safeURL(args.URL);
      return url ? `<a href="${escapeHTML(url)}">${escapeHTML(args.TEXT)}</a>` : '';
    }

    image(args) {
      const url = safeURL(args.URL);
      return url ? `<img src="${escapeHTML(url)}" alt="${escapeHTML(args.ALT)}">` : '';
    }

    input(args) {
      const type = String(args.TYPE).toLowerCase();
      if (!inputTypes.has(type)) return '';
      return `<input type="${type}" placeholder="${escapeHTML(args.PLACEHOLDER)}">`;
    }

    style(args) {
      return `<style>${args.CSS}</style>`;
    }

    comment(args) {
      const text = String(args.TEXT).replace(/--/g, '- -');
      return `<!-- ${text} -->`;
    }

    combine(args) {
      return `${args.FIRST}${args.SECOND}`;
    }

    document(args) {
      return `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${escapeHTML(args.TITLE)}</title>\n</head>\n<body>\n${args.BODY}\n</body>\n</html>`;
    }

    ensureOverlay() {
      if (this.overlay) return true;
      if (!Scratch.extensions.unsandboxed || typeof document === 'undefined' ||
          !Scratch.vm || !Scratch.vm.renderer || !Scratch.vm.renderer.addOverlay) return false;

      this.overlay = document.createElement('div');
      this.overlay.style.width = '100%';
      this.overlay.style.height = '100%';
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.visibility = 'hidden';

      const shadow = this.overlay.attachShadow({ mode: 'open' });
      const styles = document.createElement('style');
      styles.textContent = ':host{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;pointer-events:none;visibility:hidden;z-index:10}.htmlblocks-content{position:absolute;left:calc(50% + var(--htmlblocks-x,0px));top:calc(50% - var(--htmlblocks-y,0px));transform:translate(-50%,-50%);pointer-events:auto;box-sizing:border-box;overflow:auto}';
      this.content = document.createElement('div');
      this.content.className = 'htmlblocks-content';
      shadow.append(styles, this.content);
      Scratch.vm.renderer.addOverlay(this.overlay, 'scale');
      return true;
    }

    showHTML(args) {
      if (!this.ensureOverlay()) return;
      this.content.innerHTML = args.HTML;
      this.overlay.style.visibility = 'visible';
    }

    updateHTML(args) {
      this.showHTML(args);
    }

    hideHTML() {
      if (this.overlay) this.overlay.style.visibility = 'hidden';
    }

    clearHTML() {
      if (!this.overlay) return;
      this.content.replaceChildren();
      this.overlay.style.visibility = 'hidden';
    }

    setCSSVar(target, name, value) {
      if (!target || !target.style) return;
      if (typeof target.style.setProperty === 'function') {
        target.style.setProperty(name, value);
      } else {
        target.style[name] = value;
      }
    }

    setPosition(args) {
      if (!this.ensureOverlay()) return;
      const x = Number(args.X);
      const y = Number(args.Y);
      if (Number.isFinite(x)) this.setCSSVar(this.overlay, '--htmlblocks-x', `${x}px`);
      if (Number.isFinite(y)) this.setCSSVar(this.overlay, '--htmlblocks-y', `${y}px`);
    }

    setSize(args) {
      if (!this.ensureOverlay()) return;
      const width = Number(args.WIDTH);
      const height = Number(args.HEIGHT);
      if (Number.isFinite(width)) this.content.style.width = `${Math.max(0, width)}px`;
      if (Number.isFinite(height)) this.content.style.height = `${Math.max(0, height)}px`;
    }

    setBackground(args) {
      if (this.ensureOverlay()) this.content.style.backgroundColor = args.COLOR;
    }

    setTextColor(args) {
      if (this.ensureOverlay()) this.content.style.color = args.COLOR;
    }

    setFontSize(args) {
      if (!this.ensureOverlay()) return;
      const size = Number(args.SIZE);
      if (Number.isFinite(size)) this.content.style.fontSize = `${Math.max(1, size)}px`;
    }
  }

  Scratch.extensions.register(new HTMLBlocks());
})(Scratch);
