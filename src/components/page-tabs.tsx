import Link from "next/link";
import { FileText, BookOpen, ClipboardCheck, Bug, ScrollText, type LucideIcon } from "lucide-react";
import { PAGE_KINDS, PAGE_LABELS, PAGE_SLUGS, type PageKind } from "@/lib/domain/pages";

const META: Record<PageKind, { icon: LucideIcon; desc: string }> = {
  exec_report: { icon: FileText, desc: "Tổng quan cho sếp" },
  user_guide: { icon: BookOpen, desc: "Hướng dẫn sử dụng" },
  test_cases: { icon: ClipboardCheck, desc: "Bộ test case" },
  bugs: { icon: Bug, desc: "Bug đã/đang xử lý" },
  changelog: { icon: ScrollText, desc: "Nhật ký theo tính năng" },
};

export function PageTabs({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {PAGE_KINDS.map((kind: PageKind) => {
        const { icon: Icon, desc } = META[kind];
        return (
          <Link
            key={kind}
            href={`/projects/${projectId}/${PAGE_SLUGS[kind]}`}
            className="group flex flex-col gap-2 rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-navy/5 text-navy transition group-hover:bg-teal/10 group-hover:text-teal">
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-semibold text-navy">{PAGE_LABELS[kind]}</span>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </Link>
        );
      })}
    </div>
  );
}
