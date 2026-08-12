# EH Translator

[English](README.en.md) | [中文](README.md)

A personalized Chrome bilingual translation extension, forked from the open-source [KISS Translator](https://github.com/fishjar/kiss-translator).

## Personal Customizations

- Auto-translates webpages on open by default (including page titles)
- UI defaults to Simplified Chinese; input-box / selection / subtitle translation all target Simplified Chinese by default
- Default translation provider: Microsoft (free, zero configuration)
- Shortcuts follow the upstream: `Alt+Q` translate / `Alt+C` toggle style / `Alt+K` tranbox / `Alt+S` selection translation / `Alt+O` options / `Alt+I` input-box translation

## Features

- [x] Minimalist
- [x] Open source
- [x] Browser support
  - [x] Chrome/Edge (trimmed to Chrome build target for personal use)
- [x] Multiple translation providers
  - [x] Google/Microsoft
  - [x] OpenAI/Gemini/Claude/Ollama/DeepSeek
  - [x] DeepL/DeepLFree/DeepLX
  - [x] Chrome BuiltinAI
- [x] Common translation scenarios
  - [x] Bilingual webpage translation
  - [x] Input-box translation (via shortcut)
  - [x] Selection translation with dictionary lookup and word favorites
  - [x] Mouse-hover translation
  - [x] YouTube subtitle translation (bilingual display, sentence merging, AI segmentation, custom styles)
- [x] Translation styles
  - [x] Auto text detection & manual rules
  - [x] Custom translation styles
  - [x] Rich-text translation preserving links/styles
  - [x] Translation-only mode (hide original)
- [x] Advanced API features
  - [x] Custom APIs (anything is possible via hooks)
  - [x] Batch aggregation requests
  - [x] Streaming output
  - [x] AI context memory
  - [x] Custom AI glossary
  - [x] Hooks & custom parameters for all providers
- [x] Cross-client sync
  - [x] KISS-Worker (cloudflare/docker)
  - [x] WebDAV
- [x] Custom translation rules (subscription/sharing, custom terms)
- [x] Customizable shortcuts

## Installation

> Personal fork, not published to app stores. Build locally and load as an unpacked extension.

### Browser extension (Chrome/Edge)

```sh
pnpm install
pnpm build:chrome
```

Open [chrome://extensions](chrome://extensions) (or `edge://extensions`), enable "Developer mode", click "Load unpacked", and select the `build/chrome` directory.

## Related Projects (upstream ecosystem)

- Data sync service: [https://github.com/fishjar/kiss-worker](https://github.com/fishjar/kiss-worker)
- Community subscription rules: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)

## FAQ

### How to change shortcuts

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### Rule priority

Personal rules > subscribed rules > global rules

### Custom API not working in Tampermonkey

The userscript requires domain whitelisting for cross-origin requests.

### Custom API hook examples

See: [custom-api_v2.md](https://github.com/ervinhez/EH-Translator/blob/master/custom-api_v2.md)

## Development

```sh
git clone https://github.com/ervinhez/EH-Translator.git
cd EH-Translator
pnpm install
pnpm build
```

### External trigger example

```js
// `toggle_translate`   toggle translation
// `toggle_styles`      toggle styles
// `toggle_popup`       toggle control panel
// `toggle_transbox`    toggle translation box
// `toggle_hover_node`  translate hovered paragraph
// `input_translate`    translate input box
window.dispatchEvent(new CustomEvent("eh_translator", {detail: { action: "toggle_translate" }}));
```

## Upstream

- [KISS Translator](https://github.com/fishjar/kiss-translator): upstream project. Thanks to the original author.
