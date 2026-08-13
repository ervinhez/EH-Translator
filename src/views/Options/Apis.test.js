import { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import Apis from "./Apis";
import {
  GEMINI_INTERACTIONS_URL,
  OPT_TRANS_OPENAI,
  OPT_TRANS_GEMINI,
} from "../../config";
import { fetchModelCatalog } from "../../libs/modelList";
import { apiTranslate } from "../../apis";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.scrollTo = jest.fn();

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key, fallback) => fallback || key,
}));

jest.mock("../../hooks/Api", () => ({
  useApiList: jest.fn(),
  useApiItem: jest.fn(),
}));

jest.mock("../../hooks/Prompt", () => ({
  usePromptList: () => ({ prompts: [] }),
}));

jest.mock("../../hooks/Confirm", () => ({
  useConfirm: () => jest.fn(),
}));

jest.mock("../../hooks/Alert", () => ({
  useAlert: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock("../../hooks/Setting", () => ({
  useSetting: () => ({
    setting: { prompts: [], subtitleSetting: {}, uiLang: "zh" },
  }),
}));

jest.mock("../../apis", () => ({
  apiTranslate: jest.fn(),
}));

jest.mock("../../libs/modelList", () => ({
  fetchModelCatalog: jest.fn(),
}));

jest.mock("./ReusableAutocomplete", () => {
  return function MockReusableAutocomplete({
    name,
    label,
    value,
    options = [],
    onChange,
    onFocus,
    textFieldProps = {},
  }) {
    return (
      <label>
        {label}
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          onFocus={onFocus}
          data-options={options.join(",")}
          aria-invalid={textFieldProps.error ? "true" : "false"}
        />
        {textFieldProps.helperText ? (
          <span>{textFieldProps.helperText}</span>
        ) : null}
      </label>
    );
  };
});

const { useApiList, useApiItem } = require("../../hooks/Api");

function createApi(overrides = {}) {
  return {
    apiSlug: "OpenAI",
    apiName: "OpenAI",
    apiType: OPT_TRANS_OPENAI,
    url: "https://api.openai.com/v1/chat/completions",
    key: "sk-test",
    model: "gpt-4",
    modelListUrl: "https://api.openai.com/v1/models",
    sortOrder: 0,
    httpTimeout: 30,
    ...overrides,
  };
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderApis(api = createApi(), update = jest.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  useApiList.mockReturnValue({
    transApis: [api],
    addApi: jest.fn(),
    deleteApi: jest.fn(),
    deleteApis: jest.fn(),
    pinApis: jest.fn(),
    disableApis: jest.fn(),
    enableApis: jest.fn(),
    copyApi: jest.fn(),
    alphaSortApis: jest.fn(),
    reorderApis: jest.fn(),
  });
  useApiItem.mockReturnValue({
    api,
    update,
    reset: jest.fn(),
  });

  await act(async () => {
    root.render(<Apis />);
  });
  await flushEffects();

  return {
    container,
    update,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function getInput(container, name) {
  const input = container.querySelector(`input[name="${name}"]`);
  if (!input) {
    throw new Error(`Unable to find input named ${name}`);
  }
  return input;
}

function getSaveButton(container) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "save"
  );
}

async function expandAdvanced(container) {
  const toggle = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "more"
  );
  if (!toggle) {
    throw new Error("Unable to find advanced settings toggle");
  }
  await act(async () => {
    toggle.click();
  });
  return toggle;
}

describe("Apis settings visibility", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("keeps core fields visible and collapses advanced settings by default", async () => {
    const view = await renderApis();
    const coreFields = ["apiName", "url", "key", "model", "isDisabled"];
    const advancedFields = [
      "transAllnow",
      "rootMargin",
      "modelListUrl",
      "temperature",
      "maxTokens",
      "useBatchFetch",
      "batchInterval",
      "batchSize",
      "batchLength",
      "batchConcurrency",
      "useStream",
      "streamRenderMode",
      "useContext",
      "contextSize",
      "fetchLimit",
      "fetchInterval",
      "httpTimeout",
      "nobatchPromptSlug",
      "batchPromptSlug",
      "subtitlePromptSlug",
      "dictPromptSlug",
      "thinkingMode",
      "placeholder",
      "placetag",
      "placetagFormat",
      "aiTerms",
      "customHeader",
      "customBody",
      "reqHook",
      "resHook",
    ];

    for (const name of coreFields) {
      expect(view.container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(getSaveButton(view.container)).not.toBeUndefined();
    expect(
      Array.from(view.container.querySelectorAll("button")).find(
        (button) => button.textContent === "click_test"
      )
    ).not.toBeUndefined();
    for (const name of advancedFields) {
      expect(view.container.querySelector(`[name="${name}"]`)).toBeNull();
    }

    const toggle = await expandAdvanced(view.container);

    for (const name of advancedFields) {
      if (name === "streamRenderMode") continue;
      expect(view.container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(
      view.container.querySelector('[name="streamRenderMode"]')
    ).toBeNull();
    for (const name of coreFields) {
      expect(view.container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }

    await act(async () => {
      Simulate.change(getInput(view.container, "useStream"), {
        target: { name: "useStream", value: true },
      });
    });
    expect(
      view.container.querySelector('[name="streamRenderMode"]')
    ).not.toBeNull();

    await act(async () => {
      toggle.click();
    });
    for (const name of coreFields) {
      expect(view.container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    for (const name of advancedFields) {
      expect(view.container.querySelector(`[name="${name}"]`)).toBeNull();
    }

    view.unmount();
  });
});

describe("Apis model list", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("loads model list once when model input is focused", async () => {
    fetchModelCatalog.mockResolvedValue({
      models: ["gpt-4o", "gpt-4.1"],
      thinkingCapabilities: {},
    });
    const view = await renderApis();
    const modelInput = getInput(view.container, "model");

    await act(async () => {
      Simulate.focus(modelInput);
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      Simulate.focus(modelInput);
      await Promise.resolve();
    });

    expect(fetchModelCatalog).toHaveBeenCalledTimes(1);
    expect(fetchModelCatalog).toHaveBeenCalledWith({
      apiType: OPT_TRANS_OPENAI,
      modelListUrl: "https://api.openai.com/v1/models",
      key: "sk-test",
      httpTimeout: 30,
    });
    expect(modelInput.getAttribute("data-options")).toContain("gpt-4o");

    view.unmount();
  });




  test("does not load model list without url or key", async () => {
    const view = await renderApis(createApi({ key: "" }));
    const modelInput = getInput(view.container, "model");

    await act(async () => {
      Simulate.focus(modelInput);
      await Promise.resolve();
    });

    expect(fetchModelCatalog).not.toHaveBeenCalled();

    view.unmount();
  });

  test("keeps manual model input saveable", async () => {
    const update = jest.fn();
    const view = await renderApis(createApi(), update);
    const modelInput = getInput(view.container, "model");

    await act(async () => {
      Simulate.change(modelInput, {
        target: {
          name: "model",
          value: "manual-model",
        },
      });
    });

    const saveButton = getSaveButton(view.container);
    await act(async () => {
      Simulate.click(saveButton);
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "manual-model",
      })
    );

    view.unmount();
  });

  test("shows fetch failure without clearing model", async () => {
    fetchModelCatalog
      .mockRejectedValueOnce(new Error("network failed"))
      .mockResolvedValueOnce({
        models: ["gpt-4o"],
        thinkingCapabilities: {},
      });
    const view = await renderApis();
    const modelInput = getInput(view.container, "model");

    await act(async () => {
      Simulate.focus(modelInput);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(modelInput.value).toBe("gpt-4");
    expect(modelInput.getAttribute("aria-invalid")).toBe("true");
    expect(view.container.textContent).toContain("model_list_fetch_failed");
    expect(fetchModelCatalog).toHaveBeenCalledTimes(1);

    await act(async () => {
      Simulate.focus(getInput(view.container, "model"));
      await Promise.resolve();
      await Promise.resolve();
    });
    await flushEffects();

    expect(fetchModelCatalog).toHaveBeenCalledTimes(2);
    expect(getInput(view.container, "model").getAttribute("aria-invalid")).toBe(
      "false"
    );
    expect(
      getInput(view.container, "model").getAttribute("data-options")
    ).toContain("gpt-4o");

    view.unmount();
  });


  test("ignores a failed catalog request after the URL changes", async () => {
    let rejectRequest;
    fetchModelCatalog.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          rejectRequest = reject;
        })
    );
    const view = await renderApis();
    await expandAdvanced(view.container);


    await act(async () => {
      Simulate.focus(getInput(view.container, "model"));
      await Promise.resolve();
    });
    await act(async () => {
      Simulate.change(getInput(view.container, "modelListUrl"), {
        target: {
          name: "modelListUrl",
          value: "https://api.openai.com/v1/models?fixed=1",
        },
      });
      await Promise.resolve();
    });
    await act(async () => {
      rejectRequest(new Error("stale network failure"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getInput(view.container, "model").getAttribute("aria-invalid")).toBe(
      "false"
    );
    expect(view.container.textContent).not.toContain("stale network failure");

    view.unmount();
  });

  test("ignores a successful catalog request after the URL changes", async () => {
    let resolveOldRequest;
    let resolveNewRequest;
    fetchModelCatalog
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOldRequest = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNewRequest = resolve;
          })
      );
    const view = await renderApis();
    await expandAdvanced(view.container);


    await act(async () => {
      Simulate.focus(getInput(view.container, "model"));
      await Promise.resolve();
    });
    await act(async () => {
      Simulate.change(getInput(view.container, "modelListUrl"), {
        target: {
          name: "modelListUrl",
          value: "https://api.openai.com/v1/models?current=1",
        },
      });
      await Promise.resolve();
    });
    await flushEffects();
    await act(async () => {
      Simulate.focus(getInput(view.container, "model"));
      await Promise.resolve();
    });

    await act(async () => {
      resolveNewRequest({
        models: ["current-model"],
        thinkingCapabilities: {},
      });
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      resolveOldRequest({
        models: ["stale-model"],
        thinkingCapabilities: {},
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    const modelOptions = getInput(view.container, "model").getAttribute(
      "data-options"
    );
    expect(modelOptions).toContain("current-model");
    expect(modelOptions).not.toContain("stale-model");

    view.unmount();
  });

  test("resets model list error when url or key changes", async () => {
    fetchModelCatalog.mockRejectedValue(new Error("network failed"));
    const view = await renderApis();
    await expandAdvanced(view.container);

    const modelInput = getInput(view.container, "model");
    const modelListUrlInput = getInput(view.container, "modelListUrl");

    await act(async () => {
      Simulate.focus(modelInput);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(modelInput.getAttribute("aria-invalid")).toBe("true");
    expect(view.container.textContent).toContain("model_list_fetch_failed");

    await act(async () => {
      Simulate.change(modelListUrlInput, {
        target: {
          name: "modelListUrl",
          value: "https://api.openai.com/v1/models?fixed=1",
        },
      });
      await Promise.resolve();
    });

    expect(modelInput.getAttribute("aria-invalid")).toBe("false");
    expect(view.container.textContent).not.toContain("model_list_fetch_failed");

    view.unmount();
  });
});

describe("Apis batch concurrency", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("disables batch concurrency at one when context is enabled", async () => {
    const view = await renderApis(
      createApi({
        useBatchFetch: true,
        batchConcurrency: 4,
        useContext: true,
      })
    );
    await expandAdvanced(view.container);

    const concurrencyInput = getInput(view.container, "batchConcurrency");

    expect(concurrencyInput.value).toBe("1");
    expect(concurrencyInput.disabled).toBe(true);
    expect(view.container.textContent).toContain(
      "batch_concurrency_context_hint"
    );

    view.unmount();
  });
});

describe("Apis temperature input", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("renders temperature input for OpenAI but hides it for Gemini", async () => {
    const openaiView = await renderApis(
      createApi({ apiType: OPT_TRANS_OPENAI })
    );
    await expandAdvanced(openaiView.container);

    expect(
      openaiView.container.querySelector('input[name="temperature"]')
    ).not.toBeNull();
    openaiView.unmount();

    const geminiView = await renderApis(
      createApi({ apiType: OPT_TRANS_GEMINI })
    );
    await expandAdvanced(geminiView.container);

    expect(
      geminiView.container.querySelector('input[name="temperature"]')
    ).toBeNull();
    geminiView.unmount();

  });
});

describe("Apis static thinking normalization", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test("normalizes an unsupported saved effort before saving", async () => {
    const update = jest.fn();
    const view = await renderApis(
      createApi({
        apiSlug: OPT_TRANS_GEMINI,
        apiType: OPT_TRANS_GEMINI,
        model: "gemini-3-pro-preview",
        thinkingMode: "enabled",
        thinkingEffort: "medium",
      }),
      update
    );
    await expandAdvanced(view.container);

    const effortInput = getInput(view.container, "thinkingEffort");
    expect(effortInput.value).toBe("_default");

    await act(async () => {
      Simulate.change(effortInput, {
        target: { name: "thinkingEffort", value: "_default" },
      });
    });
    await act(async () => {
      Simulate.click(getSaveButton(view.container));
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        thinkingMode: "enabled",
        thinkingEffort: "high",
      })
    );

    view.unmount();
  });

  test("enables GPT-5.1 with low effort when clicking test", async () => {
    apiTranslate.mockResolvedValue({ trText: "你好" });
    const view = await renderApis(
      createApi({
        model: "gpt-5.1",
        thinkingMode: "disabled",
        thinkingEffort: "none",
      })
    );
    await expandAdvanced(view.container);


    await act(async () => {
      Simulate.change(getInput(view.container, "thinkingMode"), {
        target: { name: "thinkingMode", value: "enabled" },
      });
    });
    await act(async () => {
      Simulate.click(
        Array.from(view.container.querySelectorAll("button")).find(
          (button) => button.textContent === "click_test"
        )
      );
      await Promise.resolve();
    });

    expect(apiTranslate).toHaveBeenCalledWith(
      expect.objectContaining({
        apiSetting: expect.objectContaining({
          thinkingMode: "enabled",
          thinkingEffort: "low",
        }),
      })
    );

    view.unmount();
  });

  test("uses Gemini 3.6 Flash medium as the interface default", async () => {
    apiTranslate.mockResolvedValue({ trText: "你好" });
    const view = await renderApis(
      createApi({
        apiSlug: OPT_TRANS_GEMINI,
        apiType: OPT_TRANS_GEMINI,
        url: GEMINI_INTERACTIONS_URL,
        model: "gemini-3.6-flash",
        thinkingMode: "disabled",
        thinkingEffort: "minimal",
      })
    );
    await expandAdvanced(view.container);


    await act(async () => {
      Simulate.change(getInput(view.container, "thinkingMode"), {
        target: { name: "thinkingMode", value: "enabled" },
      });
    });
    expect(getInput(view.container, "thinkingEffort").value).toBe("medium");

    await act(async () => {
      Simulate.click(
        Array.from(view.container.querySelectorAll("button")).find(
          (button) => button.textContent === "click_test"
        )
      );
      await Promise.resolve();
    });
    expect(apiTranslate).toHaveBeenCalledWith(
      expect.objectContaining({
        apiSetting: expect.objectContaining({
          thinkingMode: "enabled",
          thinkingEffort: "medium",
        }),
      })
    );

    view.unmount();
  });
});

describe("Apis unknown model thinking warning", () => {
  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  test.each(["enabled", "disabled"])(
    "shows an error for unknown models in %s mode",
    async (thinkingMode) => {
      const view = await renderApis(
        createApi({ model: "unknown-model", thinkingMode })
      );
      await expandAdvanced(view.container);

      const modeInput = getInput(view.container, "thinkingMode");

      expect(modeInput.getAttribute("aria-invalid")).toBe("true");
      expect(view.container.textContent).toContain(
        "thinking_unknown_model_helper"
      );
      expect(
        view.container.querySelector('input[name="thinkingEffort"]')
      ).toBeNull();

      view.unmount();
    }
  );


  test("keeps API default mode free of the unknown-model error", async () => {
    const view = await renderApis(
      createApi({ model: "unknown-model", thinkingMode: "auto" })
    );
    await expandAdvanced(view.container);

    expect(
      getInput(view.container, "thinkingMode").getAttribute("aria-invalid")
    ).toBe("false");
    expect(view.container.textContent).not.toContain(
      "thinking_unknown_model_helper"
    );

    view.unmount();
  });

  test("uses the current unknown-model selection when clicking test", async () => {
    apiTranslate.mockResolvedValue({ trText: "你好" });
    const view = await renderApis(
      createApi({ model: "unknown-model", thinkingMode: "enabled" })
    );
    const testButton = Array.from(
      view.container.querySelectorAll("button")
    ).find((button) => button.textContent === "click_test");

    await act(async () => {
      Simulate.click(testButton);
      await Promise.resolve();
    });

    expect(apiTranslate).toHaveBeenCalledWith(
      expect.objectContaining({
        apiSetting: expect.objectContaining({
          model: "unknown-model",
          thinkingMode: "enabled",
        }),
        useCache: false,
        usePool: false,
      })
    );

    view.unmount();
  });
});
