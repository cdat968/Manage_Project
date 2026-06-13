import Link from "next/link";
import { PAGE_KINDS, PAGE_LABELS, PAGE_SLUGS, type PageKind } from "@/lib/domain/pages";

export function PageTabs({ projectId }: { projectId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAGE_KINDS.map((kind: PageKind) => (
        <Link
          key={kind}
          href={`/projects/${projectId}/${PAGE_SLUGS[kind]}`}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-navy hover:bg-brand-bg"
        >
          {PAGE_LABELS[kind]}
        </Link>
      ))}
    </div>
  );
}
