import { describe, it, expect } from "vitest";
import { availableLanguages } from "./languages";

describe("availableLanguages", () => {
  it("chỉ VI khi không có html_en", () => {
    expect(availableLanguages({ html_vi: "<p>x</p>", html_en: null })).toEqual(["vi"]);
  });
  it("VI + EN khi có cả hai", () => {
    expect(availableLanguages({ html_vi: "<p>x</p>", html_en: "<p>y</p>" })).toEqual(["vi", "en"]);
  });
  it("bỏ qua chuỗi rỗng/space của EN", () => {
    expect(availableLanguages({ html_vi: "<p>x</p>", html_en: "   " })).toEqual(["vi"]);
  });
  it("luôn có VI kể cả khi rỗng", () => {
    expect(availableLanguages({ html_vi: null, html_en: null })).toEqual(["vi"]);
  });
});
