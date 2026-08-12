jest.mock("./storage", () => ({
  getSettingWithDefault: jest.fn(() => Promise.resolve({ httpTimeout: 1000 })),
}));

jest.mock("../config", () => ({
  CLIENT_EXTS: [],
  DEFAULT_HTTP_TIMEOUT: 30,
  MSG_FETCH: "eh_fetch",
}));

jest.mock("./log", () => ({
  kissLog: jest.fn(),
}));

import { fetchPatcher, normalizeHttpTimeout } from "./request";

const waitFor = async (condition) => {
  for (let i = 0; i < 5 && !condition(); i += 1) {
    await Promise.resolve();
  }
  expect(condition()).toBe(true);
};

describe("normalizeHttpTimeout", () => {
  test("converts second-based timeout values to milliseconds", () => {
    expect(normalizeHttpTimeout(5)).toBe(5000);
  });

  test("keeps legacy millisecond timeout values unchanged", () => {
    expect(normalizeHttpTimeout(1000)).toBe(1000);
  });

  test("falls back to the default timeout in seconds", () => {
    expect(normalizeHttpTimeout()).toBe(30000);
    expect(normalizeHttpTimeout(0)).toBe(30000);
  });
});

describe("fetchPatcher", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("passes external abort signal to native fetch", async () => {
    const controller = new AbortController();
    global.fetch = jest.fn(() =>
      Promise.resolve(new Response("{}", { status: 200 }))
    );

    await fetchPatcher(
      "https://example.test",
      {},
      { signal: controller.signal }
    );

    expect(global.fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  test("merged signal aborts when external signal aborts", async () => {
    const controller = new AbortController();
    let capturedSignal;
    global.fetch = jest.fn((_, init) => {
      capturedSignal = init.signal;
      return new Promise(() => {});
    });

    fetchPatcher("https://example.test", {}, { signal: controller.signal });
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();

    expect(capturedSignal.aborted).toBe(true);
  });
});
