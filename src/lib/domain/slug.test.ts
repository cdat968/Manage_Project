import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("bỏ dấu tiếng Việt và nối bằng gạch ngang", () => {
    expect(slugify("Hệ thống Chấm công")).toBe("he-thong-cham-cong");
  });
  it("xử lý đ/Đ và ký tự đặc biệt", () => {
    expect(slugify("Dự án HRM (Odoo)")).toBe("du-an-hrm-odoo");
  });
  it("gộp khoảng trắng, cắt gạch thừa", () => {
    expect(slugify("  Bug   Tickets!! ")).toBe("bug-tickets");
  });
  it("chuỗi rỗng -> rỗng", () => {
    expect(slugify("   ")).toBe("");
  });
});
