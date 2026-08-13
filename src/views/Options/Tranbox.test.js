import { act } from "react";
import { createRoot } from "react-dom/client";
import Tranbox from "./Tranbox";
import { useTranbox } from "../../hooks/Tranbox";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key) => key,
}));

jest.mock("../../hooks/Tranbox", () => ({
  useTranbox: jest.fn(),
}));

jest.mock("../../hooks/Api", () => ({
  useApiList: () => ({ enabledApis: [], aiEnabledApis: [] }),
}));

jest.mock("../../hooks/Prompt", () => ({
  usePromptList: () => ({ prompts: [] }),
}));

jest.mock("../../libs/client", () => ({ isExt: false }));

jest.mock("./ShortcutInput", () => () => null);
jest.mock("../../hooks/ValidationInput", () => () => null);

function renderTranbox() {
  useTranbox.mockReturnValue({
    tranboxSetting: {
      transOpen: true,
      apiSlugs: [],
      fromLang: "auto",
      toLang: "zh-CN",
      tranboxShortcut: [],
      btnOffsetX: 0,
      btnOffsetY: 0,
    },
    updateTranbox: jest.fn(),
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Tranbox />);
  });

  return {
    container,
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("Tranbox advanced settings", () => {
  test("hides technical options until expanded", () => {
    const view = renderTranbox();

    expect(view.container.querySelector("[name='enDict']")).toBeNull();
    expect(view.container.querySelector("[name='skipLangs']")).toBeNull();

    act(() => {
      view.container.querySelector("button").click();
    });

    expect(view.container.querySelector("[name='enDict']")).not.toBeNull();
    expect(view.container.querySelector("[name='skipLangs']")).not.toBeNull();
    view.cleanup();
  });

  test("preserves the default ignored-language value when expanded", () => {
    const view = renderTranbox();

    act(() => {
      view.container.querySelector("button").click();
    });

    expect(view.container.querySelector("input[name='skipLangs']").value).toBe(
      ""
    );
    view.cleanup();
  });
});
