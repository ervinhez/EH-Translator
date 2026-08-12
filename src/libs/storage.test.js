import {
  STOKEY_SETTING,
  STOKEY_SETTING_BACKUP_V1_BEFORE_V2,
  SETTINGS_VERSION_V2,
  SETTINGS_VERSION_V3,
  DEFAULT_SUBTITLE_SETTING,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_OPENAI,
  OPT_TRANS_TENCENT,
} from "../config";
import { getSettingWithDefault, runDataMigration } from "./storage";

// 存储测试不涉及流式解析，隔离 ESM-only 依赖以免 Jest 27 在加载阶段失败。
jest.mock("@streamparser/json", () => ({ JSONParser: jest.fn() }));
// jsdom 并非扩展页面，使用空实现避免 webextension-polyfill 在模块初始化时主动抛错。
jest.mock("webextension-polyfill", () => ({}));

const readStoredJson = (key) => JSON.parse(window.localStorage.getItem(key));

describe("settings storage migration", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("runDataMigration backs up raw v1 settings and stores current settings", async () => {
    const oldSetting = {
      uiLang: "zh-CN",
      transApis: [
        {
          apiSlug: "openai",
          apiName: "OpenAI",
          systemPrompt: "custom batch prompt",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(oldSetting));

    await runDataMigration();

    const backup = readStoredJson(STOKEY_SETTING_BACKUP_V1_BEFORE_V2);
    const stored = readStoredJson(STOKEY_SETTING);

    expect(backup).toEqual(oldSetting);
    expect(stored.version).toBe(SETTINGS_VERSION_V3);
    expect(stored.transApis[0].batchPromptSlug).toMatch(
      /^prompt_migrated_batch_/
    );
    expect(stored.transApis[0]).not.toHaveProperty("systemPrompt");
  });

  test("getSettingWithDefault returns current settings for stored v1 data", async () => {
    const oldSetting = {
      uiLang: "zh",
      transApis: [
        {
          apiSlug: "openai",
          apiName: "OpenAI",
          systemPrompt: "custom batch prompt",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(oldSetting));

    const setting = await getSettingWithDefault();

    expect(setting.version).toBe(SETTINGS_VERSION_V3);
    expect(setting.transApis[0].batchPromptSlug).toMatch(
      /^prompt_migrated_batch_/
    );
    expect(setting.transApis[0]).not.toHaveProperty("systemPrompt");
  });

  test("merges the language variant default without overriding an explicit choice", async () => {
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({ version: SETTINGS_VERSION_V3, uiLang: "zh" })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      translateVariants: true,
    });

    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V3,
        translateVariants: false,
      })
    );
    await expect(getSettingWithDefault()).resolves.toMatchObject({
      translateVariants: false,
    });
  });

  test("does not replace explicitly stored Tencent entry points", async () => {
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V3,
        tranboxSetting: { apiSlugs: [OPT_TRANS_TENCENT] },
        subtitleSetting: { apiSlug: OPT_TRANS_TENCENT },
      })
    );

    await expect(getSettingWithDefault()).resolves.toMatchObject({
      tranboxSetting: { apiSlugs: [OPT_TRANS_TENCENT] },
      subtitleSetting: { apiSlug: OPT_TRANS_TENCENT },
    });
  });

  test("keeps an explicitly stored subtitle chunk length", async () => {
    // 新默认值只影响新配置；已有用户明确保存的 2000 不应被默认设置覆盖。
    expect(DEFAULT_SUBTITLE_SETTING.chunkLength).toBe(1000);
    window.localStorage.setItem(
      STOKEY_SETTING,
      JSON.stringify({
        version: SETTINGS_VERSION_V2,
        subtitleSetting: { chunkLength: 2000 },
      })
    );

    const setting = await getSettingWithDefault();

    expect(setting.subtitleSetting.chunkLength).toBe(2000);
  });

  test("normalizes legacy default thinking effort only in the loaded setting", async () => {
    const storedSetting = {
      version: SETTINGS_VERSION_V3,
      transApis: [
        {
          apiSlug: "openai",
          apiType: OPT_TRANS_OPENAI,
          model: "gpt-5.6-sol",
          thinkingMode: "enabled",
          thinkingEffort: "_default",
        },
      ],
    };
    window.localStorage.setItem(STOKEY_SETTING, JSON.stringify(storedSetting));

    const setting = await getSettingWithDefault();

    expect(setting.transApis[0].thinkingEffort).toBeNull();
    expect(readStoredJson(STOKEY_SETTING)).toEqual(storedSetting);
  });

  test("normalizes thinking settings for a fresh installation", async () => {
    const setting = await getSettingWithDefault();
    const deepseek = setting.transApis.find(
      (api) => api.apiType === OPT_TRANS_DEEPSEEK
    );

    expect(deepseek).toMatchObject({
      thinkingMode: "disabled",
      thinkingEffort: null,
    });
  });





});
