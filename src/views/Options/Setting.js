import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useSetting } from "../../hooks/Setting";
import { useI18n } from "../../hooks/I18n";
import { useAlert } from "../../hooks/Alert";
import { isExt } from "../../libs/client";
import { browser } from "../../libs/browser";
import Grid from "@mui/material/Grid";

import {
  UI_LANGS,
  TRANS_NEWLINE_LENGTH,
  CACHE_NAME,
  GLOBAL_KEY,
  GLOBLA_RULE,
  OPT_LANGDETECTOR_ALL,
  OPT_LANGS_FROM_REVERSED as OPT_LANGS_FROM,
  OPT_LANGS_TO_REVERSED as OPT_LANGS_TO,
  OPT_SHORTCUT_TRANSLATE,
  OPT_SHORTCUT_TRANSONLY,
  OPT_SHORTCUT_STYLE,
  OPT_SHORTCUT_POPUP,
  OPT_SHORTCUT_SETTING,
  OPT_SPLIT_PARAGRAPH_ALL,
  OPT_HIGHLIGHT_WORDS_ALL,
  DEFAULT_BLACKLIST,
  DEFAULT_CSPLIST,
  DEFAULT_ORILIST,
  MSG_CONTEXT_MENUS,
  MSG_UPDATE_CSP,
  DEFAULT_HTTP_TIMEOUT,
} from "../../config";
import { useShortcut } from "../../hooks/Shortcut";
import ShortcutInput from "./ShortcutInput";
import { useFab } from "../../hooks/Fab";
import { sendBgMsg } from "../../libs/msg";
import { kissLog } from "../../libs/log";
import UploadButton from "./UploadButton";
import DownloadButton from "./DownloadButton";
import ShowMoreButton from "./ShowMoreButton";
import ValidationInput from "../../hooks/ValidationInput";
import { useRules } from "../../hooks/Rules";
import { useApiList } from "../../hooks/Api";
import { useAllTextStyles } from "../../hooks/CustomStyles";

/**
 * 包装单个快捷键录入表单项组件
 */
function ShortcutItem({ action, label }) {
  const { shortcut, setShortcut } = useShortcut(action);
  return (
    <ShortcutInput value={shortcut} onChange={setShortcut} label={label} />
  );
}
function GlobalRuleSelect({
  name,
  value,
  label,
  helperText,
  onChange,
  children,
}) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      name={name}
      value={value}
      label={label}
      helperText={helperText}
      onChange={onChange}
    >
      {children}
    </TextField>
  );
}

const GLOBAL_BOOLEAN_RULE_FIELDS = [
  ["transOpen", "translate_switch"],
  ["autoScan", "auto_scan_page"],
  ["hasRichText", "has_rich_text"],
  ["hasShadowroot", "has_shadowroot"],
  ["scanAll", "scan_all_nodes"],
  ["isPlainText", "plain_text_translate"],
  ["transOnly", "show_only_translations"],
  ["wrapOriginal", "wrap_original"],
  ["transOnlyRevert", "transonly_revert"],
  ["transTitle", "translate_page_title"],
];

/**
 * 展示扩展版快捷键的组件 (仅 Extension 模式)
 */
export function ExtCommands() {
  const [commands, setCommands] = useState([]);
  const i18n = useI18n();
  const alert = useAlert();

  useEffect(() => {
    if (browser?.commands?.getAll) {
      browser.commands
        .getAll()
        .then((cmds) => {
          if (cmds) {
            setCommands(cmds.filter((c) => c.description));
          }
        })
        .catch((err) => {
          console.error("fetch commands error:", err);
        });
    }
  }, []);

  if (!commands || commands.length === 0) return null;

  const handleEdit = () => {
    let url = "chrome://extensions/shortcuts";
    const ua = navigator.userAgent;
    if (ua.includes("Firefox/")) {
      alert.info(i18n("firefox_shortcut_edit_hint"));
      return;
    }
    if (ua.includes("Edg/")) {
      url = "edge://extensions/shortcuts";
    } else if (ua.includes("OPR/")) {
      url = "opera://extensions/shortcuts";
    } else if (ua.includes("Brave/")) {
      url = "brave://extensions/shortcuts";
    }

    if (browser?.tabs?.create) {
      browser.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <Box>
      <Grid container spacing={2} columns={12}>
        {commands.map((cmd) => (
          <Grid item xs={12} sm={12} md={6} lg={3} key={cmd.name}>
            <Stack direction="row" alignItems="flex-start">
              <TextField
                size="small"
                label={cmd.description}
                value={cmd.shortcut || ""}
                fullWidth
                disabled
              />
              <IconButton onClick={handleEdit}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * 基本查词/运行设置中心页面 (Settings)
 */
export default function Settings() {
  const i18n = useI18n();
  // 设置 Hook
  const { setting, updateSetting } = useSetting();
  const alert = useAlert();
  // 悬浮查词 FAB 浮球设置 Hook
  const { fab, updateFab } = useFab();
  const [showMore, setShowMore] = useState(false);


  // 基础表单输入状态更改回调
  const handleChange = (e) => {
    e.preventDefault();
    let { name, value } = e.target;

    // 特定联动：若是浏览器扩展模式，且修改了右键菜单或CSP规则列表，立即向后台 content script / background 发送同步消息
    switch (name) {
      case "contextMenuType":
        isExt && sendBgMsg(MSG_CONTEXT_MENUS, value);
        break;
      case "csplist":
        isExt && sendBgMsg(MSG_UPDATE_CSP, { csplist: value });
        break;
      case "orilist":
        isExt && sendBgMsg(MSG_UPDATE_CSP, { orilist: value });
        break;
      default:
    }
    updateSetting({
      [name]: value,
    });
  };

  // 清除本地网络请求翻译缓存
  const handleClearCache = () => {
    try {
      caches.delete(CACHE_NAME);
      alert.success(i18n("clear_success"));
    } catch (err) {
      kissLog("clear cache", err);
    }
  };

  // 导入备份 JSON 配置文件
  const handleImport = async (data) => {
    try {
      updateSetting(JSON.parse(data));
    } catch (err) {
      kissLog("import setting", err);
    }
  };

  // 解构当前基础查词偏好设置
  const {
    uiLang,
    minLength,
    maxLength,
    clearCache,
    injectRules = true,
    newlineLength = TRANS_NEWLINE_LENGTH,
    httpTimeout = DEFAULT_HTTP_TIMEOUT,
    transInterval = 100,
    contextMenuType = 1,
    touchModes = [2],
    blacklist = DEFAULT_BLACKLIST.join(",\n"),
    csplist = DEFAULT_CSPLIST.join(",\n"),
    orilist = DEFAULT_ORILIST.join(",\n"),
    langDetector = "-",
    preInit = true,
    skipLangs = [],
    translateVariants = true,
  } = setting;
  // 解构 FAB 悬浮球的显隐状态及点击后的默认交互行为
  const {
    isHide = false,
    fabClickAction = 0,
    hideExceptionList = "",
  } = fab || {};
  const { list: rules, put: putRule } = useRules();
  const { enabledApis } = useApiList();
  const { allTextStyles } = useAllTextStyles();
  const globalRule =
    (Array.isArray(rules) &&
      rules.find((item) => item.pattern === GLOBAL_KEY)) ||
    GLOBLA_RULE;
  const getGlobalRuleValue = (key) => {
    const value = globalRule?.[key];
    return value === undefined || value === GLOBAL_KEY
      ? GLOBLA_RULE[key]
      : value;
  };
  const handleGlobalRuleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    putRule(GLOBAL_KEY, { [name]: value });
  };

  return (
    <Box>
      <Stack spacing={3}>

        {/* 基础参数网格配置区：保留日常使用会频繁调整的选项 */}
        <Box>
          <Grid container spacing={2} columns={12}>
            {/* 设置面板用户界面语言 */}
            <Grid item xs={12} sm={12} md={6} lg={3}>
              <TextField
                select
                fullWidth
                size="small"
                name="uiLang"
                value={uiLang}
                label={i18n("ui_lang")}
                onChange={handleChange}
              >
                {UI_LANGS.map(([lang, name]) => (
                  <MenuItem key={lang} value={lang}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Typography variant="h6" component="h2">
          {i18n("page_translation_defaults")}
        </Typography>
        <Box>
          <Grid container spacing={2} columns={12}>
            {/* 默认翻译服务 */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <GlobalRuleSelect
                name="apiSlug"
                value={getGlobalRuleValue("apiSlug")}
                label={i18n("translate_service")}
                onChange={handleGlobalRuleChange}
              >
                {enabledApis.map((api) => (
                  <MenuItem key={api.apiSlug} value={api.apiSlug}>
                    {api.apiName}
                  </MenuItem>
                ))}
              </GlobalRuleSelect>
            </Grid>
            {/* 默认目标语言 */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <GlobalRuleSelect
                name="toLang"
                value={getGlobalRuleValue("toLang")}
                label={i18n("to_lang")}
                onChange={handleGlobalRuleChange}
              >
                {OPT_LANGS_TO.map(([lang, name]) => (
                  <MenuItem key={lang} value={lang}>
                    {name}
                  </MenuItem>
                ))}
              </GlobalRuleSelect>
            </Grid>
            {/* 最常用的网页翻译行为开关 */}
            {GLOBAL_BOOLEAN_RULE_FIELDS.filter(([name]) =>
              ["transOpen", "transOnly"].includes(name)
            ).map(([name, label]) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
                <GlobalRuleSelect
                  name={name}
                  value={getGlobalRuleValue(name)}
                  label={i18n(label)}
                  onChange={handleGlobalRuleChange}
                >
                  <MenuItem value="false">{i18n("disable")}</MenuItem>
                  <MenuItem value="true">{i18n("enable")}</MenuItem>
                </GlobalRuleSelect>
              </Grid>
            ))}
            {/* 双语文本顺序 */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <GlobalRuleSelect
                name="transOrder"
                value={getGlobalRuleValue("transOrder")}
                label={i18n("trans_order")}
                onChange={handleGlobalRuleChange}
              >
                <MenuItem value="original-first">
                  {i18n("original_first")}
                </MenuItem>
                <MenuItem value="translation-first">
                  {i18n("translation_first")}
                </MenuItem>
              </GlobalRuleSelect>
            </Grid>
            {/* 译文样式 */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <GlobalRuleSelect
                name="textStyle"
                value={getGlobalRuleValue("textStyle")}
                label={i18n("text_style")}
                onChange={handleGlobalRuleChange}
              >
                {allTextStyles.map((item) => (
                  <MenuItem key={item.styleSlug} value={item.styleSlug}>
                    {item.styleName}
                  </MenuItem>
                ))}
              </GlobalRuleSelect>
            </Grid>
          </Grid>
        </Box>

        {/* 是否全局隐藏内容页面右侧的悬浮查词小图标 FAB */}
        <TextField
          select
          fullWidth
          size="small"
          name="isHide"
          value={isHide}
          label={i18n("hide_fab_button")}
          onChange={(e) => {
            updateFab({ isHide: e.target.value });
          }}
        >
          <MenuItem value={false}>{i18n("show")}</MenuItem>
          <MenuItem value={true}>{i18n("hide")}</MenuItem>
        </TextField>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          <Typography
            variant="h6"
            component="h2"
            data-testid="advanced-settings-title"
          >
            {i18n("advanced_settings")}
          </Typography>
          <ShowMoreButton showMore={showMore} onChange={setShowMore} />
        </Stack>

        {showMore && (
          <>
            {/* 数据导入导出控制条 */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              useFlexGap
              flexWrap="wrap"
            >
              <UploadButton
                text={i18n("import")}
                handleImport={handleImport}
              />
              <DownloadButton
                handleData={() => JSON.stringify(setting, null, 2)}
                text={i18n("export")}
                fileName={`eh-setting_v2_${Date.now()}.json`}
              />
            </Stack>

            {/* 低频运行参数：多数用户无需调整 */}
            <Box>
              <Grid container spacing={2} columns={12}>
                {/* 点击悬浮球时触发的行为 (直接展示菜单或立即启动全文双语翻译) */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="fabClickAction"
                    value={fabClickAction}
                    label={i18n("fab_click_action")}
                    onChange={(e) =>
                      updateFab({ fabClickAction: e.target.value })
                    }
                  >
                    <MenuItem value={0}>{i18n("fab_click_menu")}</MenuItem>
                    <MenuItem value={1}>
                      {i18n("fab_click_translate")}
                    </MenuItem>
                  </TextField>
                </Grid>
                {/* 页面打开时是否预先初始化运行环境 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="preInit"
                    value={preInit}
                    label={i18n("if_pre_init")}
                    onChange={handleChange}
                  >
                    <MenuItem value={true}>{i18n("enable")}</MenuItem>
                    <MenuItem value={false}>{i18n("disable")}</MenuItem>
                  </TextField>
                </Grid>
                {/* 浏览器右键上下文菜单的展示层级 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="contextMenuType"
                    value={contextMenuType}
                    label={i18n("context_menus")}
                    onChange={handleChange}
                  >
                    <MenuItem value={0}>
                      {i18n("hide_context_menus")}
                    </MenuItem>
                    <MenuItem value={1}>
                      {i18n("simple_context_menus")}
                    </MenuItem>
                    <MenuItem value={2}>
                      {i18n("secondary_context_menus")}
                    </MenuItem>
                  </TextField>
                </Grid>
                {/* 单个 DOM 文本块触发网页翻译的最小有效文本长度 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("min_translate_length")}
                    type="number"
                    name="minLength"
                    value={minLength}
                    onChange={handleChange}
                    min={1}
                    max={100}
                  />
                </Grid>
                {/* 默认源语言 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <GlobalRuleSelect
                    name="fromLang"
                    value={getGlobalRuleValue("fromLang")}
                    label={i18n("from_lang")}
                    onChange={handleGlobalRuleChange}
                  >
                    {OPT_LANGS_FROM.map(([lang, name]) => (
                      <MenuItem key={lang} value={lang}>
                        {name}
                      </MenuItem>
                    ))}
                  </GlobalRuleSelect>
                </Grid>
                {/* 允许发起单次网页段落翻译的最长文本限制 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("max_translate_length")}
                    type="number"
                    name="maxLength"
                    value={maxLength}
                    onChange={handleChange}
                    min={100}
                    max={100000}
                  />
                </Grid>
                {/* 网页中单个纯文本换行符被当作真换行截断句子的数量 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("num_of_newline_characters")}
                    type="number"
                    name="newlineLength"
                    value={newlineLength}
                    onChange={handleChange}
                    min={1}
                    max={1000}
                  />
                </Grid>
                {/* DOM 段落网页翻译扫描定时查询轮询间隔时间 (ms) */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("translate_interval")}
                    type="number"
                    name="transInterval"
                    value={transInterval}
                    onChange={handleChange}
                    min={1}
                    max={2000}
                  />
                </Grid>
                {/* 全局接口 HTTP 网络请求超时阈值 (s) */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("http_timeout")}
                    type="number"
                    name="httpTimeout"
                    value={httpTimeout}
                    onChange={handleChange}
                    min={1}
                    max={600}
                  />
                </Grid>
                {/* 移动端/触屏端特定的触摸手势快捷翻译触发方式 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="touchModes"
                    value={touchModes}
                    label={i18n("touch_translate_shortcut")}
                    onChange={handleChange}
                    SelectProps={{
                      multiple: true,
                    }}
                  >
                    {[0, 2, 3, 4, 5, 6, 7].map((item) => (
                      <MenuItem key={item} value={item}>
                        {i18n(`touch_tap_${item}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {/* 网页首选的语言自动检测服务组件 (如 Chrome Builtin, FastText 或 API) */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="langDetector"
                    value={langDetector}
                    label={i18n("detected_lang")}
                    onChange={handleChange}
                  >
                    <MenuItem value={"-"}>{i18n("disable")}</MenuItem>
                    {OPT_LANGDETECTOR_ALL.map((item) => (
                      <MenuItem value={item} key={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {/* 是否翻译同一语言的不同变体，例如简体中文与繁体中文 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="translateVariants"
                    value={translateVariants}
                    label={i18n("translate_variants")}
                    helperText={i18n("translate_variants_helper")}
                    onChange={handleChange}
                  >
                    <MenuItem value={true}>{i18n("enable")}</MenuItem>
                    <MenuItem value={false}>{i18n("disable")}</MenuItem>
                  </TextField>
                </Grid>
                {/* 是否注入订阅规则 */}
                <Grid item xs={12} sm={12} md={6} lg={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="injectRules"
                    value={injectRules}
                    label={i18n("inject_rules")}
                    onChange={handleChange}
                  >
                    <MenuItem value={true}>{i18n("enable")}</MenuItem>
                    <MenuItem value={false}>{i18n("disable")}</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* 低频网页翻译行为与兼容性参数 */}
            <Box>
              <Grid container spacing={2} columns={12}>
                {GLOBAL_BOOLEAN_RULE_FIELDS.filter(
                  ([name]) => !["transOpen", "transOnly"].includes(name)
                ).map(([name, label]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
                    <GlobalRuleSelect
                      name={name}
                      value={getGlobalRuleValue(name)}
                      label={i18n(label)}
                      onChange={handleGlobalRuleChange}
                    >
                      <MenuItem value="false">{i18n("disable")}</MenuItem>
                      <MenuItem value="true">{i18n("enable")}</MenuItem>
                    </GlobalRuleSelect>
                  </Grid>
                ))}
                {/* 译文元素标签 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <GlobalRuleSelect
                    name="transTag"
                    value={getGlobalRuleValue("transTag")}
                    label={i18n("translation_element_tag")}
                    onChange={handleGlobalRuleChange}
                  >
                    <MenuItem value="span">{`<span>`}</MenuItem>
                    <MenuItem value="font">{`<font>`}</MenuItem>
                  </GlobalRuleSelect>
                </Grid>
                {/* 包裹原文后的样式 */}
                {String(getGlobalRuleValue("wrapOriginal")) === "true" && (
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <GlobalRuleSelect
                      name="originalTextStyle"
                      value={getGlobalRuleValue("originalTextStyle")}
                      label={i18n("original_text_style")}
                      onChange={handleGlobalRuleChange}
                    >
                      {allTextStyles.map((item) => (
                        <MenuItem key={item.styleSlug} value={item.styleSlug}>
                          {item.styleName}
                        </MenuItem>
                      ))}
                    </GlobalRuleSelect>
                  </Grid>
                )}
                {/* 仅译文模式下恢复原文的延迟 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("transonly_revert_delay")}
                    type="number"
                    name="transOnlyRevertDelay"
                    value={getGlobalRuleValue("transOnlyRevertDelay")}
                    onChange={handleGlobalRuleChange}
                    min={0}
                    max={60}
                  />
                </Grid>
                {/* 长段落切分策略 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <GlobalRuleSelect
                    name="splitParagraph"
                    value={getGlobalRuleValue("splitParagraph")}
                    label={i18n("split_paragraph")}
                    onChange={handleGlobalRuleChange}
                  >
                    {OPT_SPLIT_PARAGRAPH_ALL.map((item) => (
                      <MenuItem key={item} value={item}>
                        {i18n(item)}
                      </MenuItem>
                    ))}
                  </GlobalRuleSelect>
                </Grid>
                {/* 长段落切分阈值 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <ValidationInput
                    fullWidth
                    size="small"
                    label={i18n("split_length")}
                    type="number"
                    name="splitLength"
                    value={getGlobalRuleValue("splitLength")}
                    onChange={handleGlobalRuleChange}
                    min={0}
                    max={1000}
                  />
                </Grid>
                {/* 生词高亮策略 */}
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <GlobalRuleSelect
                    name="highlightWords"
                    value={getGlobalRuleValue("highlightWords")}
                    label={i18n("highlight_words")}
                    onChange={handleGlobalRuleChange}
                  >
                    {OPT_HIGHLIGHT_WORDS_ALL.map((item) => (
                      <MenuItem key={item} value={item}>
                        {i18n(item)}
                      </MenuItem>
                    ))}
                  </GlobalRuleSelect>
                </Grid>
              </Grid>
            </Box>

            {/* 翻译跳过语言：遇到选中的目标语言时跳过自动网页翻译 */}
            <TextField
              select
              size="small"
              label={i18n("skip_langs")}
              helperText={i18n("skip_langs_helper")}
              name="skipLangs"
              value={skipLangs}
              onChange={handleChange}
              SelectProps={{
                multiple: true,
              }}
            >
              {OPT_LANGS_TO.map(([langKey, langName]) => (
                <MenuItem key={langKey} value={langKey}>
                  {langName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              multiline
              maxRows={10}
              name="hideExceptionList"
              value={hideExceptionList}
              label={i18n("fab_exception_list")}
              helperText={i18n("fab_exception_list_helper")}
              onChange={(e) => updateFab({ hideExceptionList: e.target.value })}
            />

            {/* 网页翻译的黑名单域名正则排除列表 (一行一条) */}
            <TextField
              size="small"
              label={i18n("translate_blacklist")}
              helperText={i18n("pattern_helper")}
              name="blacklist"
              value={blacklist}
              onChange={handleChange}
              maxRows={10}
              multiline
            />

            {/* 扩展专属的高级网络设置 (只在 Extension 模式下展示) */}
            {isExt ? (
              <>
                {/* 是否在浏览器关闭/重启时自动清空网页翻译的已缓存译文 */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  name="clearCache"
                  value={clearCache}
                  label={i18n("if_clear_cache")}
                  onChange={handleChange}
                  helperText={
                    <Link component="button" onClick={handleClearCache}>
                      {i18n("clear_all_cache_now")}
                    </Link>
                  }
                >
                  <MenuItem value={false}>{i18n("clear_cache_never")}</MenuItem>
                  <MenuItem value={true}>{i18n("clear_cache_restart")}</MenuItem>
                </TextField>

                {/* 跨域安全 CSP 旁路加载白名单与 Ori 白名单 */}
                <TextField
                  size="small"
                  label={i18n("disabled_orilist")}
                  helperText={i18n("pattern_helper")}
                  name="orilist"
                  value={orilist}
                  onChange={handleChange}
                  multiline
                />
                <TextField
                  size="small"
                  label={i18n("disabled_csplist")}
                  helperText={
                    i18n("pattern_helper") + " " + i18n("disabled_csplist_helper")
                  }
                  name="csplist"
                  value={csplist}
                  onChange={handleChange}
                  multiline
                />

                <ExtCommands />
              </>
            ) : (
              // 油猴脚本环境运行：渲染脚本侧注册的全局热键录入面板
              <>
                <Box>
                  <Grid container spacing={2} columns={12}>
                    <Grid item xs={12} sm={12} md={6} lg={3}>
                      <ShortcutItem
                        action={OPT_SHORTCUT_TRANSLATE}
                        label={i18n("toggle_translate_shortcut")}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={3}>
                      <ShortcutItem
                        action={OPT_SHORTCUT_TRANSONLY}
                        label={i18n("toggle_transonly_shortcut")}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={3}>
                      <ShortcutItem
                        action={OPT_SHORTCUT_STYLE}
                        label={i18n("toggle_style_shortcut")}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={3}>
                      <ShortcutItem
                        action={OPT_SHORTCUT_POPUP}
                        label={i18n("toggle_popup_shortcut")}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={3}>
                      <ShortcutItem
                        action={OPT_SHORTCUT_SETTING}
                        label={i18n("open_setting_shortcut")}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
