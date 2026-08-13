import { act } from "react";
import { createRoot } from "react-dom/client";
import SubtitleSetting from "./Subtitle";
import { useSubtitle } from "../../hooks/Subtitle";
import { useApiList } from "../../hooks/Api";
import { usePromptList } from "../../hooks/Prompt";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("../../hooks/I18n", () => ({
  useI18n: () => (key) => key,
}));

jest.mock("../../hooks/Subtitle", () => ({
  useSubtitle: jest.fn(),
}));

jest.mock("../../hooks/Api", () => ({
  useApiList: jest.fn(),
}));

jest.mock("../../hooks/Prompt", () => ({
  usePromptList: jest.fn(),
}));

jest.mock("../../hooks/ValidationInput", () => () => null);
jest.mock("./CodeField", () => () => null);

function renderSubtitle() {
  useSubtitle.mockReturnValue({
    subtitleSetting: {
      enabled: true,
      apiSlug: "page-api",
      segSlug: "-",
      autoTranslate: true,
      toLang: "zh-CN",
      isBilingual: true,
      displayOrder: "original-first",
      originStyle: "",
      translationStyle: "",
      windowStyle: "",
    },
    updateSubtitle: jest.fn(),
  });
  useApiList.mockReturnValue({
    enabledApis: [{ apiSlug: "page-api", apiName: "Page API" }],
    aiEnabledApis: [],
  });
  usePromptList.mockReturnValue({ prompts: [] });

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<SubtitleSetting />);
  });

  return {
    container,
    cleanup() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

test("hides subtitle technical settings until advanced settings expand", () => {
  const view = renderSubtitle();

  expect(view.container.querySelector("[name='segSlug']")).toBeNull();

  act(() => {
    view.container.querySelector("button").click();
  });

  expect(view.container.querySelector("[name='segSlug']")).not.toBeNull();
  view.cleanup();
});
