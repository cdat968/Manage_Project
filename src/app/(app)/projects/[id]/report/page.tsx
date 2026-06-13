import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPage } from "@/lib/pages/queries";
import { HtmlEditor } from "@/components/html-editor";

export default async function ReportEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id, "exec_report");
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-[1400px] px-8 py-10">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
      >
        <ChevronLeft className="size-4" />
        Về dự án
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy">Report cho sếp</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Dán HTML self-contained (mermaid/script đều chạy). Hỗ trợ song ngữ VI/EN.
      </p>
      <HtmlEditor page={page} slug="report" />
    </main>
  );
}
