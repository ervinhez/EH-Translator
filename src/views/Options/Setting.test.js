import { act } from "react";
import { createRoot } from "react-dom/client";
import Settings, { ExtCommands } from "./Setting";
import { browser } from "../../libs/browser";
import { useAlert } from "../../hooks/Alert";
import { useSetting } from "../../hooks/Setting";
import { useFab } from "../../hooks/Fab";
import { useRules } from "../../hooks/Rules";
import { useApiList } from "../../hooks/Api";
import { useAllTextStyles } from "../../hooks/CustomStyles";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../libs/browser", () => ({
  browser: {
    commands: { getAll: jest.fn() },
    tabs: { create: jest.fn() },
  },
}));

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key) => key,
}));

jest.mock("../../hooks/Alert", () => ({
  useAlert: jest.fn(),
}));

jest.mock("../../hooks/Setting", () => ({ useSetting: jest.fn() }));
jest.mock("../../hooks/Rules", () => ({ useRules: jest.fn() }));
jest.mock("../../hooks/Api", () => ({ useApiList: jest.fn() }));
jest.mock("../../hooks/CustomStyles", () => ({
  useAllTextStyles: jest.fn(),
}));
jest.mock("../../libs/client", () => ({ isExt: true }));
jest.mock("../../hooks/Shortcut", () => ({ useShortcut: jest.fn() }));
jest.mock("./ShortcutInput", () => () => null);
jest.mock("../../hooks/Fab", () => ({ useFab: jest.fn() }));
jest.mock("../../libs/msg", () => ({ sendBgMsg: jest.fn() }));
jest.mock("../../libs/log", () => ({
  kissLog: jest.fn(),
  LogLevel: { INFO: { value: 3 } },
}));
jest.mock("./UploadButton", () =>
  ({ text }) =>
    jest.requireActual("react").createElement(
      "button",
      { type: "button", "data-testid": "upload-button" },
      text
    )
);
jest.mock("./DownloadButton", () =>
  ({ text }) =>
    jest.requireActual("react").createElement(
      "button",
      { type: "button", "data-testid": "download-button" },
      text
    )
);
jest.mock("../../hooks/ValidationInput", () => () => null);
const mockPutRule = jest.fn();

const commands = [
  {
    name: "toggleTranslate",
    description: "Toggle Translate",
    shortcut: "Alt+Q",
  },
];
const alert = { info: jest.fn() };
const originalUserAgent = navigator.userAgent;

function setUserAgent(userAgent) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
}

async function renderCommands() {
  const container = document.createElement("div");
  const root = createRoot(container);

  await act(async () => {
    root.render(<ExtCommands />);
  });

  return { container, root };
}
async function renderSettings() {
  const container = document.createElement("div");
  const root = createRoot(container);

  await act(async () => {
    root.render(<Settings />);
  });

  return { container, root };
}

describe("ExtCommands", () => {
  beforeEach(() => {
    browser.commands.getAll.mockResolvedValue(commands);
    browser.tabs.create.mockReset();
    alert.info.mockReset();
    useAlert.mockReturnValue(alert);
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
  });

  test("shows Firefox shortcut-management instructions without opening a tab", async () => {
    setUserAgent("Mozilla/5.0 Firefox/141.0");
    const { container, root } = await renderCommands();

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(alert.info).toHaveBeenCalledWith("firefox_shortcut_edit_hint");
    expect(browser.tabs.create).not.toHaveBeenCalled();
    act(() => root.unmount());
  });

  test("opens Chromium's extension shortcut page", async () => {
    setUserAgent("Mozilla/5.0 Chrome/139.0.0.0 Safari/537.36");
    const { container, root } = await renderCommands();

    await act(async () => {
      container.querySelector("button").click();
    });

    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: "chrome://extensions/shortcuts",
    });
    expect(alert.info).not.toHaveBeenCalled();
    act(() => root.unmount());
  });
});

describe("Settings global webpage defaults", () => {
  beforeEach(() => {
    useSetting.mockReturnValue({
      setting: {
        uiLang: "zh",
        clearCache: false,
        logLevel: 3,
      },
      updateSetting: jest.fn(),
    });
    useFab.mockReturnValue({
      fab: {},
      updateFab: jest.fn(),
    });
    useRules.mockReturnValue({
      list: [{ pattern: "*", apiSlug: "microsoft", toLang: "zh-CN" }],
      put: mockPutRule,
    });
    useApiList.mockReturnValue({
      enabledApis: [{ apiSlug: "microsoft", apiName: "Microsoft" }],
    });
    useAllTextStyles.mockReturnValue({
      allTextStyles: [{ styleSlug: "style_none", styleName: "None" }],
    });
    browser.commands.getAll.mockResolvedValue([]);
  });

  test("renders global rule defaults in basic settings and persists changes", async () => {
    const { container, root } = await renderSettings();
    const targetLanguage = container.querySelector('input[name="toLang"]');

    expect(container.querySelector("h2")?.textContent).toBe(
      "page_translation_defaults"
    );
    expect(targetLanguage).not.toBeNull();

    await act(async () => {
      const setNativeValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setNativeValue.call(targetLanguage, "en");
      targetLanguage.dispatchEvent(new Event("input", { bubbles: true }));
      targetLanguage.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(mockPutRule).toHaveBeenCalledWith("*", { toLang: "en" });
  });

  test("keeps low-frequency settings collapsed until explicitly expanded", async () => {
    const { container, root } = await renderSettings();
    const toggle = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "more"
    );
    const lowFrequencyFields = [
      "fabClickAction",
      "contextMenuType",
      "fromLang",
      "autoScan",
      "preInit",
    ];

    expect(
      container.querySelector('[data-testid="advanced-settings-title"]')
        ?.textContent
    ).toBe("advanced_settings");
    expect(container.querySelector('[data-testid="upload-button"]')).toBeNull();
    expect(container.querySelector('[data-testid="download-button"]')).toBeNull();
    for (const name of lowFrequencyFields) {
      expect(container.querySelector(`input[name="${name}"]`)).toBeNull();
    }
    expect(container.querySelector('input[name="logLevel"]')).toBeNull();
    expect(toggle).not.toBeUndefined();

    await act(async () => {
      toggle.click();
    });

    expect(
      container.querySelector('[data-testid="upload-button"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="download-button"]')
    ).not.toBeNull();
    for (const name of lowFrequencyFields) {
      expect(container.querySelector(`input[name="${name}"]`)).not.toBeNull();
    }
    expect(container.querySelector('input[name="logLevel"]')).toBeNull();

    await act(async () => {
      toggle.click();
    });

    for (const name of lowFrequencyFields) {
      expect(container.querySelector(`input[name="${name}"]`)).toBeNull();
    }
    expect(container.querySelector('[data-testid="upload-button"]')).toBeNull();
    expect(container.querySelector('[data-testid="download-button"]')).toBeNull();
    act(() => root.unmount());
  });
});
