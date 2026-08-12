# EH Translator

[English](README.en.md) | [中文](README.md)

基于开源 [KISS Translator](https://github.com/fishjar/kiss-translator) fork 的个人定制版 Chrome 双语对照翻译扩展。

## 个人定制说明

- 默认自动开启整页双语翻译（打开外文网页即翻译，含页面标题）
- 设置界面默认中文，划词/字幕翻译默认目标语言均为简体中文
- 默认翻译服务为 Microsoft（免费、无需配置，开箱即用）
- 快捷键沿用原版：`Alt+Q` 翻译 / `Alt+C` 切换样式 / `Alt+K` 翻译弹窗 / `Alt+S` 划词翻译 / `Alt+O` 设置

## 特性

- [x] 保持简约
- [x] 开放源代码
- [x] 适配浏览器
  - [x] Chrome/Edge（按个人使用修剪，仅保留 Chrome 构建目标）
- [x] 支持多种翻译服务
  - [x] Google/Microsoft
  - [x] OpenAI/Gemini/Claude/Ollama/DeepSeek
  - [x] DeepL/DeepLFree/DeepLX
  - [x] Chrome浏览器内置AI翻译(BuiltinAI)
- [x] 覆盖常见翻译场景
  - [x] 网页双语对照翻译
  - [x] 划词翻译
    - [x] 任意页面打开翻译框，可用多种翻译服务对比翻译
    - [x] 英文词典翻译
    - [x] 收藏词汇
  - [x] 鼠标悬停翻译
  - [x] YouTube 字幕翻译
    - 支持任意翻译服务对视频字幕进行翻译并双语显示
    - 内置基础的字幕合并与断句算法，提升翻译效果
    - 支持AI断句功能，可进一步提升翻译质量
    - 自定义字幕样式
- [x] 支持多样翻译效果
  - [x] 支持自动识别文本与手动规则两种模式
    - 自动识别文本模式使得绝大部分网站无需编写规则也能翻译完整
    - 手动规则模式，可以针对特定网站极致优化
  - [x] 自定义译文样式
  - [x] 支持富文本翻译及显示，能够尽量保留原文中的链接及其他文本样式
  - [x] 支持仅显示译文（隐藏原文）
- [x] 翻译接口高级功能
  - [x] 通过自定义接口，理论上支持任何翻译接口
  - [x] 聚合批量发送翻译文本
  - [x] 支持流式传输，实时显示翻译结果
  - [x] 支持AI上下文会话记忆功能，提升翻译效果
  - [x] 自定义AI术语词典
  - [x] 所有接口均支持Hook和自定义参数等高级功能
- [x] 跨客户端数据同步
  - [x] KISS-Worker（cloudflare/docker）
  - [x] WebDAV
- [x] 自定义翻译规则
  - [x] 规则订阅/规则分享
  - [x] 自定义专业术语
- [x] 自定义快捷键
  - `Alt+Q` 开启翻译
  - `Alt+C` 切换样式
  - `Alt+K` 打开设置弹窗
  - `Alt+S` 打开翻译弹窗/翻译选中文字
  - `Alt+O` 打开设置页面

## 安装

> 个人 fork，未发布到应用商店，请本地构建后以开发者模式加载。

### 浏览器扩展（Chrome）

```sh
pnpm install
pnpm build:chrome
```

打开 [chrome://extensions](chrome://extensions)（或 Edge 的 `edge://extensions`），开启"开发者模式"，点击"加载已解压的扩展程序"，选择 `build/chrome` 目录。


## 关联项目（上游生态）

- 数据同步服务: [https://github.com/fishjar/kiss-worker](https://github.com/fishjar/kiss-worker)
  - 可用于本项目的数据同步服务。
  - 亦可用于分享个人的私有规则列表。
  - 自己部署，自己管理，数据私有。
- 社区订阅规则: [https://github.com/fishjar/kiss-rules](https://github.com/fishjar/kiss-rules)
  - 提供社区维护的，最新最全的订阅规则列表。
  - 求助规则相关的问题。

## 常见问题

### 如何设置快捷键

在插件管理那里设置，例如：

- chrome [chrome://extensions/shortcuts](chrome://extensions/shortcuts)
- firefox [about:addons](about:addons)

### 网页翻译规则的优先级

个人规则 > 订阅规则 > 全局规则

其中全局规则优先级最低，但非常重要，相当于兜底规则。

### 接口（Ollama等）测试失败

一般接口测试失败常见有以下几种原因：

- 地址填错了：
  - 比如 `Ollama` 有原生接口地址和 `Openai` 兼容的地址，本插件目前统一支持 `Openai` 兼容的地址，不支持 `Ollama` 原生接口地址
- 某些AI模型不支持聚合翻译：
  - 此种情况可以选择禁用聚合翻译或通过自定义接口的方式来使用。
  - 或通过自定义接口的方式来使用，详情参考： [自定义接口示例文档](https://github.com/ervinhez/EH-Translator/blob/master/custom-api_v2.md)
- 某些AI模型的参数不一致：
  - 比如 `Gemini` 原生接口参数非常不一致，部分版本的模型不支持某些参数会导致返回错误。
  - 此种情况可以通过 `Hook` 修改请求 `body` ,或者更换为 `Gemini2` (`Openai` 兼容的地址)
- 服务器跨域限制访问，返回403错误：
  - 比如 `Ollama` 启动时须添加环境变量 `OLLAMA_ORIGINS=*`, 参考：https://github.com/fishjar/kiss-translator/issues/174

### 填写的接口在油猴脚本不能使用

油猴脚本需要增加域名白名单，否则不能发出请求。

### 如何设置自定义接口的hook函数

自定义接口功能非常强大、灵活，理论可以接入任何翻译接口。

示例参考： [custom-api_v2.md](https://github.com/ervinhez/EH-Translator/blob/master/custom-api_v2.md)

## 未来规划

本项目为个人使用，跟随上游 [KISS Translator](https://github.com/fishjar/kiss-translator) 更新，同时按个人习惯持续微调。

## 开发指引

```sh
git clone https://github.com/ervinhez/EH-Translator.git
cd EH-Translator
pnpm install
pnpm build
```

### 外部触发示例

```js
// `toggle_translate`   切换翻译
// `toggle_styles`      切换样式
// `toggle_popup`       打开/关闭控制面板
// `toggle_transbox`    打开/关闭翻译弹窗
// `toggle_hover_node`  翻译鼠标悬停段落
window.dispatchEvent(new CustomEvent("eh_translator", {detail: { action: "toggle_translate" }}));
```

## 上游项目

- [KISS Translator](https://github.com/fishjar/kiss-translator)：本项目的上游来源，感谢原作者的开源贡献。
