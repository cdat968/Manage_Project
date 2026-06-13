import { describe, it, expect } from "vitest";
import { PAGE_KINDS, PAGE_LABELS, buildDefaultPages } from "./pages";

describe("pages domain", () => {
  it("có đúng 5 kind", () => {
    expect(PAGE_KINDS).toEqual([
      "exec_report",
      "user_guide",
      "test_cases",
      "bugs",
      "changelog",
    ]);
  });

  it("buildDefaultPages tạo 5 dòng gắn project_id + nhãn VI", () => {
    const rows = buildDefaultPages("p1");
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.project_id === "p1")).toBe(true);
    expect(rows.map((r) => r.kind)).toEqual(PAGE_KINDS);
    expect(rows[0]).toEqual({
      project_id: "p1",
      kind: "exec_report",
      title: PAGE_LABELS.exec_report,
    });
  });
});
