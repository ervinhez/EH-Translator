import {
  API_SPE_TYPES,
  DEFAULT_API_LIST,
  DEFAULT_API_TYPE,
  OPT_ALL_TRANS_TYPES,
  OPT_DEFAULT_TRANS_TYPES,
  OPT_LANGS_FROM_SPEC,
  OPT_LANGS_TO_SPEC,
  GEMINI_GENERATE_CONTENT_URL,
  GEMINI_INTERACTIONS_URL,
  getDefaultApiSetting,
  getGeminiThinkingEfforts,
  getThinkingCapability,
  isThinkingMinimumFallback,
  normalizeThinkingSettings,
  normalizeApiThinkingSettings,
  normalizeApiModelListUrls,
  OPT_TRANS_DEEPSEEK,
  OPT_TRANS_CUSTOMIZE,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_GEMINI,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_OPENAI,
} from "./api";

test("uses DeepSeek as the fallback default API", () => {
  expect(DEFAULT_API_TYPE).toBe(OPT_TRANS_DEEPSEEK);
});

test("keeps a small new-install default without hiding optional APIs", () => {
  expect(OPT_DEFAULT_TRANS_TYPES).toEqual([
    OPT_TRANS_DEEPSEEK,
    OPT_TRANS_CUSTOMIZE,
  ]);
  expect(DEFAULT_API_LIST.map((api) => api.apiType)).toEqual(
    OPT_DEFAULT_TRANS_TYPES
  );
  expect(DEFAULT_API_LIST[0]).toMatchObject({
    url: "https://api.deepseek.com",
  });
  expect(OPT_ALL_TRANS_TYPES).toContain(OPT_TRANS_MICROSOFT);
  expect(API_SPE_TYPES.builtin.has(OPT_TRANS_MICROSOFT)).toBe(true);
});

test("all default AI APIs define a thinking mode", () => {
  for (const api of DEFAULT_API_LIST.filter((item) =>
    API_SPE_TYPES.ai.has(item.apiType)
  )) {
    expect(["auto", "enabled", "disabled"]).toContain(api.thinkingMode);
  }
});

test("keeps disabled as the initial thinking mode", () => {
  for (const api of DEFAULT_API_LIST.filter((item) =>
    API_SPE_TYPES.ai.has(item.apiType)
  )) {
    expect(api.thinkingMode).toBe("disabled");
  }
});

describe("unified thinking capabilities", () => {
  test.each(["gpt-5.6-sol", "gpt-5.4-pro", "gpt-5.3-codex", "gpt-5"])(
    "keeps the OpenAI interface default for model %s",
    (model) => {
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "enabled",
        }).thinkingEffort
      ).toBeNull();
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "disabled",
        })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: "none" });
    }
  );

  test.each(["gpt-5.1", "gpt-5.1-2025-11-13"])(
    "enables GPT-5.1 with its lowest non-disabled effort for model %s",
    (model) => {
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "enabled",
        })
      ).toEqual({ thinkingMode: "enabled", thinkingEffort: "low" });
      expect(
        normalizeThinkingSettings({
          apiType: OPT_TRANS_OPENAI,
          model,
          thinkingMode: "disabled",
        })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: "none" });
    }
  );

  test("does not guess thinking parameters for unknown models", () => {
    expect(
      getThinkingCapability({
        apiType: OPT_TRANS_OPENAI,
        model: "unknown-model",
      })
    ).toBeNull();
    expect(
      getThinkingCapability({
        apiType: OPT_TRANS_GEMINI,
        model: "custom-model",
      })
    ).toBeNull();
    expect(
      normalizeThinkingSettings({
        apiType: OPT_TRANS_OPENAI,
        model: "unknown-model",
        thinkingMode: "enabled",
      })
    ).toEqual({ thinkingMode: "enabled", thinkingEffort: "_default" });
  });

  test.each([[OPT_TRANS_DEEPSEEK, "deepseek"]])(
    "uses explicit thinking modes for %s",
    (apiType, adapter) => {
      const capability = getThinkingCapability({ apiType });
      expect(capability).toMatchObject({ adapter });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "auto" })
      ).toEqual({ thinkingMode: "auto", thinkingEffort: "_default" });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "enabled" })
      ).toEqual({ thinkingMode: "enabled", thinkingEffort: null });
      expect(
        normalizeThinkingSettings({ apiType, thinkingMode: "disabled" })
      ).toEqual({ thinkingMode: "disabled", thinkingEffort: null });
    }
  );

  test("keeps Claude native and hides unsupported legacy models", () => {
    expect(
      getThinkingCapability({
        apiType: OPT_TRANS_CLAUDE,
        model: "claude-3-haiku-20240307",
      })
    ).toBeNull();
    expect(
      normalizeThinkingSettings({
        apiType: OPT_TRANS_CLAUDE,
        model: "claude-mythos-5",
        thinkingMode: "disabled",
      })
    ).toEqual({ thinkingMode: "disabled", thinkingEffort: "low" });
  });

  test("normalizes loaded static settings once and preserves stable references", () => {
    const transApis = [
      {
        apiType: OPT_TRANS_OPENAI,
        model: "gpt-5.6-sol",
        thinkingMode: "enabled",
        thinkingEffort: "_default",
      },
    ];

    const normalized = normalizeApiThinkingSettings(transApis);
    expect(normalized).not.toBe(transApis);
    expect(normalized[0]).toMatchObject({ thinkingEffort: null });
    expect(normalizeApiThinkingSettings(normalized)).toBe(normalized);
  });
});

test("Gemini uses stable Interactions while the model list stays on v1beta", () => {
  const gemini = getDefaultApiSetting(OPT_TRANS_GEMINI);

  expect(gemini).toMatchObject({
    url: GEMINI_INTERACTIONS_URL,
    modelListUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-3.6-flash",
    thinkingMode: "disabled",
  });
});

test("resolves Gemini modes with only thinkingMode and thinkingEffort", () => {
  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_GENERATE_CONTENT_URL,
      model: "gemini-2.5-flash",
      thinkingMode: "disabled",
    })
  ).toEqual({ thinkingMode: "disabled", thinkingEffort: 0 });

  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_INTERACTIONS_URL,
      model: "gemini-3.6-flash",
      thinkingMode: "enabled",
    })
  ).toEqual({ thinkingMode: "enabled", thinkingEffort: "medium" });
  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_GENERATE_CONTENT_URL,
      model: "gemini-2.5-flash",
      thinkingMode: "enabled",
    })
  ).toEqual({ thinkingMode: "enabled", thinkingEffort: -1 });
  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_INTERACTIONS_URL,
      model: "gemini-2.5-flash",
      thinkingMode: "enabled",
    })
  ).toEqual({ thinkingMode: "enabled", thinkingEffort: null });
  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_GENERATE_CONTENT_URL,
      model: "gemini-2.5-flash-lite",
      thinkingMode: "enabled",
    })
  ).toEqual({ thinkingMode: "enabled", thinkingEffort: "low" });

  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_INTERACTIONS_URL,
      model: "gemini-3-pro-preview",
      thinkingMode: "enabled",
      thinkingEffort: "medium",
    })
  ).toEqual({ thinkingMode: "enabled", thinkingEffort: "high" });
  expect(
    normalizeThinkingSettings({
      apiType: OPT_TRANS_GEMINI,
      url: GEMINI_INTERACTIONS_URL,
      model: "gemini-3-pro-preview",
      thinkingMode: "auto",
      thinkingEffort: "high",
    })
  ).toEqual({ thinkingMode: "auto", thinkingEffort: "_default" });
});

test("filters native Gemini thinking efforts by model capability", () => {
  expect(
    getGeminiThinkingEfforts({
      apiType: OPT_TRANS_GEMINI,
      model: "gemini-3.1-pro-preview",
    }).map((item) => item.value)
  ).toEqual(["high", "medium", "low"]);
  expect(
    getGeminiThinkingEfforts({
      apiType: OPT_TRANS_GEMINI,
      model: "gemini-3-pro-preview",
    }).map((item) => item.value)
  ).toEqual(["high", "low"]);
  expect(
    getGeminiThinkingEfforts({
      apiType: OPT_TRANS_GEMINI,
      model: "gemini-3.1-flash-lite-image",
    }).map((item) => item.value)
  ).toEqual(["high", "minimal"]);
  expect(
    getGeminiThinkingEfforts({
      apiType: OPT_TRANS_GEMINI,
      model: "gemini-3.6-flash",
    }).map((item) => item.value)
  ).toEqual(["high", "medium", "low", "minimal"]);
});

describe("normalizeApiModelListUrls", () => {
  test("旧数据缺少 modelListUrl 时按接口类型补充默认模型列表 URL", () => {
    const transApis = [
      {
        apiSlug: "DeepSeek",
        apiType: OPT_TRANS_DEEPSEEK,
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis).not.toBe(transApis);
    expect(nextApis[0]).toEqual({
      apiSlug: "DeepSeek",
      apiType: OPT_TRANS_DEEPSEEK,
      modelListUrl: "https://api.deepseek.com/models",
    });
  });

  test("仍能为未列入新默认列表的旧接口补充模型地址", () => {
    const transApis = [
      {
        apiSlug: "OpenAI",
        apiType: OPT_TRANS_OPENAI,
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis[0].modelListUrl).toBe("https://api.openai.com/v1/models");
  });

  test("用户已明确保存为空字符串时不覆盖 modelListUrl", () => {
    const transApis = [
      {
        apiSlug: "OpenAI",
        apiType: OPT_TRANS_OPENAI,
        modelListUrl: "",
      },
    ];

    const nextApis = normalizeApiModelListUrls(transApis);

    expect(nextApis).toBe(transApis);
    expect(nextApis[0].modelListUrl).toBe("");
  });

  test("没有需要补充的字段时保持原数组引用", () => {
    const transApis = [
      {
        apiSlug: "DeepSeek",
        apiType: OPT_TRANS_DEEPSEEK,
        modelListUrl: "https://custom.example.com/models",
      },
    ];

    expect(normalizeApiModelListUrls(transApis)).toBe(transApis);
  });
});
