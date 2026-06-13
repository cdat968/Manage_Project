"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HtmlViewer } from "@/components/html-viewer";
import { savePage } from "@/lib/pages/actions";
import { toast } from "sonner";

type PageRow = {
  id: string;
  project_id: string;
  title: string;
  published: boolean;
  html_vi: string | null;
  html_en: string | null;
};

export function HtmlEditor({ page, slug }: { page: PageRow; slug: string }) {
  const [title, setTitle] = useState(page.title);
  const [htmlVi, setHtmlVi] = useState(page.html_vi ?? "");
  const [htmlEn, setHtmlEn] = useState(page.html_en ?? "");
  const [published, setPublished] = useState(page.published);
  const [editLang, setEditLang] = useState<"vi" | "en">("vi");
  const [saving, setSaving] = useState(false);

  const currentHtml = editLang === "vi" ? htmlVi : htmlEn;
  const setCurrentHtml = editLang === "vi" ? setHtmlVi : setHtmlEn;

  async function onSave() {
    setSaving(true);
    const fd = new FormData();
    fd.set("id", page.id);
    fd.set("project_id", page.project_id);
    fd.set("slug", slug);
    fd.set("title", title);
    fd.set("html_vi", htmlVi);
    fd.set("html_en", htmlEn);
    if (published) fd.set("published", "on");
    await savePage(fd);
    setSaving(false);
    toast.success("Đã lưu");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="title">Tiêu đề trang</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="size-4"
          />
          Cho phép chia sẻ (published)
        </label>
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-navy text-white hover:bg-navy-deep"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex gap-1">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setEditLang(l)}
                className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition ${
                  editLang === l
                    ? "bg-navy text-white"
                    : "border border-line bg-white text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            value={currentHtml}
            onChange={(e) => setCurrentHtml(e.target.value)}
            placeholder={`Dán HTML (${editLang.toUpperCase()})...`}
            spellCheck={false}
            className="h-[70vh] w-full rounded-xl border border-line bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-teal">
            Xem trước
          </span>
          <HtmlViewer htmlVi={htmlVi} htmlEn={htmlEn} />
        </div>
      </div>
    </div>
  );
}
