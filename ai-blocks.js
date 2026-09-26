(function (Scratch) {
  'use strict';

  if (!Scratch || !Scratch.extensions) {
    throw new Error('AI Blocks requires a Scratch-compatible extension runtime.');
  }

  const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const DEFAULT_MODEL = 'gpt-4o-mini';
  const SYSTEM_PROMPT = [
    'You are an assistant that helps people create Scratch and PenguinMod projects.',
    'Explain solutions clearly for beginners.',
    'When the user asks for code, provide the exact Scratch blocks as a fenced scratchblocks script.',
    'Use standard scratchblocks syntax, preserve stack order, and indent blocks inside loops, conditionals, and other C-shaped blocks.',
    'After the script, briefly explain where the blocks go and what they do.',
    'Do not claim that you inserted blocks into the project; you can only provide scripts for the user to recreate.'
  ].join(' ');

  const cleanText = (value) => String(value ?? '').trim();

  const validEndpoint = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        return url.href;
      }
    } catch (error) {
      return '';
    }
    return '';
  };

  const responseText = (data) => {
    if (Array.isArray(data?.choices)) {
      const content = data.choices[0]?.message?.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.map((part) => part.text || '').join('');
    }
    if (Array.isArray(data?.output)) {
      return data.output.flatMap((item) => item.content || []).map((part) => part.text || '').join('');
    }
    return typeof data?.text === 'string' ? data.text : '';
  };

  class AIBlocks {
    constructor() {
      this.overlay = null;
      this.chatLog = null;
      this.promptInput = null;
      this.endpointInput = null;
      this.modelInput = null;
      this.keyInput = null;
      this.messages = [{ role: 'system', content: SYSTEM_PROMPT }];
      this.busy = false;
    }

    getInfo() {
      return {
        id: 'aihelper',
        name: 'AI Code Chat',
        color1: '#0F766E',
        color2: '#0D625B',
        color3: '#094F49',
        blocks: [
          {
            opcode: 'openChat',
            blockType: Scratch.BlockType.COMMAND,
            text: 'open AI coding chat'
          }
        ]
      };
    }

    openChat() {
      if (!this.ensureChat()) return;
      this.overlay.style.visibility = 'visible';
      this.promptInput.focus();
    }

    ensureChat() {
      if (this.overlay) return true;
      if (!Scratch.extensions.unsandboxed || typeof document === 'undefined' ||
          !Scratch.vm?.renderer || typeof Scratch.vm.renderer.addOverlay !== 'function') return false;

      this.overlay = document.createElement('div');
      this.overlay.style.width = '100%';
      this.overlay.style.height = '100%';
      this.overlay.style.visibility = 'hidden';
      this.overlay.style.pointerEvents = 'none';

      const shadow = this.overlay.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        :host{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:hidden;pointer-events:none;visibility:hidden;z-index:1000;font-family:Arial,sans-serif;color:#17211f}
        *{box-sizing:border-box}
        .panel{position:absolute;right:10px;bottom:10px;width:min(440px,calc(100% - 20px));height:min(520px,calc(100% - 20px));min-height:210px;display:flex;flex-direction:column;background:#f8fbfa;border:1px solid #91aaa4;border-radius:10px;box-shadow:0 8px 30px #10252255;overflow:hidden;pointer-events:auto}
        .top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:#0f766e;color:white}
        .title{font-size:15px;font-weight:700}
        button{font:inherit;cursor:pointer;border:0;border-radius:6px;padding:7px 10px}
        .close{background:transparent;color:white;font-size:20px;line-height:1;padding:3px 7px}
        details{border-bottom:1px solid #d5e1de;padding:7px 10px;font-size:12px}
        summary{cursor:pointer;font-weight:600}
        .settings{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
        .settings label{display:flex;flex-direction:column;gap:3px;min-width:0}
        .settings label:first-child,.settings label:last-child{grid-column:1/-1}
        input,textarea{font:inherit;border:1px solid #afc1bc;border-radius:5px;padding:7px;background:white;color:#17211f;min-width:0}
        .chat{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
        .message{max-width:95%;padding:8px 10px;border-radius:8px;background:#e5efec;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.4}
        .user{align-self:flex-end;background:#d3eeea}
        .assistant{align-self:flex-start}
        .script{margin:7px 0 3px;padding:9px;background:#fff;border:1px solid #c1d2cd;border-left:5px solid #0f766e;border-radius:4px;overflow:auto;white-space:pre;font:12px/1.5 monospace;color:#17211f}
        .copy{font-size:11px;padding:4px 7px;background:#dce9e5;color:#18332e}
        .composer{display:flex;align-items:flex-end;gap:7px;padding:9px;border-top:1px solid #d5e1de;background:white}
        .composer textarea{flex:1;resize:vertical;min-height:38px;max-height:100px}
        .send{background:#0f766e;color:white;font-weight:600}
        .send:disabled{opacity:.55;cursor:wait}
        .status{padding:0 10px 6px;color:#536a64;font-size:11px}
        @media(max-height:300px){.panel{height:calc(100% - 12px);bottom:6px}.top{padding:6px 9px}details{padding:5px 8px}}
      `;

      const panel = document.createElement('section');
      panel.className = 'panel';
      const top = document.createElement('header');
      top.className = 'top';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = 'AI Scratch Coding';
      const close = document.createElement('button');
      close.className = 'close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Close chat');
      close.textContent = '×';
      close.addEventListener('click', () => { this.overlay.style.visibility = 'hidden'; });
      top.append(title, close);

      const settings = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'AI provider settings';
      settings.append(summary);
      const settingFields = document.createElement('div');
      settingFields.className = 'settings';
      this.endpointInput = this.makeSetting(settingFields, 'API endpoint', 'url', DEFAULT_ENDPOINT);
      this.modelInput = this.makeSetting(settingFields, 'Model', 'text', DEFAULT_MODEL);
      this.keyInput = this.makeSetting(settingFields, 'API key (kept in memory)', 'password', '');
      settings.append(settingFields);

      this.chatLog = document.createElement('div');
      this.chatLog.className = 'chat';
      this.addMessage('assistant', 'Hi! Ask me how to make something in Scratch. For coding questions, I will include a copyable scratchblocks script.');

      const status = document.createElement('div');
      status.className = 'status';
      status.textContent = 'Replies are suggestions; scripts are not inserted into your project automatically.';
      const form = document.createElement('form');
      form.className = 'composer';
      this.promptInput = document.createElement('textarea');
      this.promptInput.placeholder = 'Ask about a Scratch project or blocks...';
      this.promptInput.setAttribute('aria-label', 'Message the AI');
      const send = document.createElement('button');
      send.className = 'send';
      send.type = 'submit';
      send.textContent = 'Send';
      form.append(this.promptInput, send);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        this.sendMessage(send);
      });

      panel.append(top, settings, this.chatLog, status, form);
      shadow.append(style, panel);
      Scratch.vm.renderer.addOverlay(this.overlay, 'scale');
      return true;
    }

    makeSetting(container, labelText, type, value) {
      const label = document.createElement('label');
      label.append(document.createTextNode(labelText));
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      label.append(input);
      container.append(label);
      return input;
    }

    addMessage(role, text) {
      const bubble = document.createElement('div');
      bubble.className = `message ${role}`;
      if (role === 'assistant') {
        const segments = String(text).split(/```([^\n`]*)\n?([\s\S]*?)```/g);
        for (let index = 0; index < segments.length; index += 3) {
          if (segments[index]) bubble.append(document.createTextNode(segments[index]));
          if (index + 2 < segments.length) {
            const language = segments[index + 1].trim().toLowerCase();
            const code = segments[index + 2].replace(/\n$/, '');
            const pre = document.createElement('pre');
            pre.className = 'script';
            pre.textContent = code;
            bubble.append(pre);
            if (language === 'scratchblocks' || language === 'blocks') {
              const copy = document.createElement('button');
              copy.className = 'copy';
              copy.type = 'button';
              copy.textContent = 'Copy blocks';
              copy.addEventListener('click', async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  copy.textContent = 'Copied';
                } catch (error) {
                  copy.textContent = 'Select and copy';
                }
              });
              bubble.append(copy);
            }
          }
        }
      } else {
        bubble.textContent = text;
      }
      this.chatLog.append(bubble);
      this.chatLog.scrollTop = this.chatLog.scrollHeight;
      return bubble;
    }

    async sendMessage(sendButton) {
      const prompt = cleanText(this.promptInput.value);
      if (!prompt || this.busy) return;
      const endpoint = validEndpoint(this.endpointInput.value);
      const model = cleanText(this.modelInput.value) || DEFAULT_MODEL;
      const apiKey = cleanText(this.keyInput.value);
      if (!endpoint) {
        this.addMessage('assistant', 'Please enter a valid HTTPS endpoint (HTTP is allowed only for localhost).');
        return;
      }

      this.busy = true;
      sendButton.disabled = true;
      this.promptInput.value = '';
      this.addMessage('user', prompt);
      this.messages.push({ role: 'user', content: prompt });
      const thinking = this.addMessage('assistant', 'Thinking...');
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({ model, messages: this.messages })
        });
        if (!response.ok) {
          const details = await response.text();
          throw new Error(details || `HTTP ${response.status}`);
        }
        const answer = responseText(await response.json());
        if (!answer) throw new Error('The provider returned an empty response.');
        this.messages.push({ role: 'assistant', content: answer });
        this.messages = [this.messages[0], ...this.messages.slice(-16)];
        thinking.remove();
        this.addMessage('assistant', answer);
      } catch (error) {
        thinking.remove();
        const reason = error?.message || String(error);
        this.addMessage('assistant', `Request failed: ${reason}. Check the API key, endpoint, and provider CORS settings.`);
      } finally {
        this.busy = false;
        sendButton.disabled = false;
        this.promptInput.focus();
      }
    }
  }

  Scratch.extensions.register(new AIBlocks());
})(Scratch);
