export const PAGE_KINDS = [
  "exec_report",
  "user_guide",
  "test_cases",
  "bugs",
  "changelog",
] as const;

export type PageKind = (typeof PAGE_KINDS)[number];

export const PAGE_LABELS: Record<PageKind, string> = {
  exec_report: "Report cho sếp",
  user_guide: "Hướng dẫn sử dụng",
  test_cases: "Test Cases",
  bugs: "Bug Tickets",
  changelog: "Nhật ký triển khai",
};

export const PAGE_SLUGS: Record<PageKind, string> = {
  exec_report: "report",
  user_guide: "guide",
  test_cases: "test-cases",
  bugs: "bugs",
  changelog: "changelog",
};

export function buildDefaultPages(projectId: string) {
  return PAGE_KINDS.map((kind) => ({
    project_id: projectId,
    kind,
    title: PAGE_LABELS[kind],
  }));
}
