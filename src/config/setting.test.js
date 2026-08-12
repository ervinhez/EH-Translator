import {
  DEFAULT_MOUSE_HOVER_SETTING,
  DEFAULT_SETTING,
  DEFAULT_SUBTITLE_SETTING,
  DEFAULT_TRANBOX_SETTING,
} from "./setting";
import { OPT_TRANS_DEEPSEEK } from "./api";
import { GLOBAL_KEY } from "./rules";

describe("translation box defaults", () => {
  test("translates language variants by default", () => {
    expect(DEFAULT_SETTING.translateVariants).toBe(true);
  });

  test("uses DeepSeek for default tranbox and subtitle entry points", () => {
    expect(DEFAULT_TRANBOX_SETTING.apiSlugs).toEqual([OPT_TRANS_DEEPSEEK]);
    expect(DEFAULT_SUBTITLE_SETTING.apiSlug).toBe(OPT_TRANS_DEEPSEEK);
  });

  test("does not ignore any language by default", () => {
    expect(DEFAULT_TRANBOX_SETTING.skipLangs).toEqual([]);
  });

  test("follows the current page rule for hover bubbles by default", () => {
    expect(DEFAULT_MOUSE_HOVER_SETTING.apiSlug).toBe(GLOBAL_KEY);
  });
});
