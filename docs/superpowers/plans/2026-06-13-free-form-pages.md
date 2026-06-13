# Plan 3 — Free-form Pages (Report cho sếp + Hướng dẫn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Soạn & xem 2 trang HTML tự do của mỗi project (Report cho sếp, Hướng dẫn) — song ngữ VI/EN, lưu nguyên HTML self-contained, render trong iframe sandbox (giữ mermaid/script/style như file mẫu).

**Architecture:** Mỗi project đã có sẵn 2 dòng `page` kind `exec_report`/`user_guide` (Plan 2 tự sinh). Trang editor (`/projects/[id]/report`, `/projects/[id]/guide`) load page → editor client (tab VI/EN + textarea HTML + live preview iframe + Save + publish). Lưu bằng Server Action. Viewer render `<iframe sandbox srcDoc={html}>` + toggle VI/EN. Component viewer dùng lại cho `/v/[token]` ở Plan 7.

**Tech Stack:** Như Plan 2 + shadcn `tabs`, `textarea`, `switch`.

---

## Tiền đề
- Chạy trong Docker. Đã đăng nhập owner.
- `page` có cột `html_vi`, `html_en`, `title`, `published` (Plan 1).
- `page-tabs` đã link tới `/projects/[id]/report` và `/projects/[id]/guide` (Plan 2).

## File Structure (Plan 3)
```
src/
  lib/
    pages/
      languages.ts        # availableLanguages(page) (TDD)
      languages.test.ts
      queries.ts          # getPage(projectId, kind)
      actions.ts          # savePage server action
  components/
    ui/                   # shadcn add: tabs, textarea, switch
    html-viewer.tsx       # iframe sandbox + toggle VI/EN (client)
    html-editor.tsx       # editor VI/EN + preview + save (client)
  app/(app)/projects/[id]/
    report/page.tsx       # exec_report editor screen
    guide/page.tsx        # user_guide editor screen
```

---

## Task 1: availableLanguages helper (TDD)

**Files:** Create `src/lib/pages/languages.ts`, `src/lib/pages/languages.test.ts`

- [ ] **Step 1: Test (FAIL trước)**

`src/lib/pages/languages.test.ts`:
```typescript
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
```

- [ ] **Step 2: Chạy → FAIL** — `docker compose run --rm web npm test src/lib/pages/languages.test.ts`

- [ ] **Step 3: Implement `languages.ts`**

```typescript
export type Lang = "vi" | "en";

export function availableLanguages(page: {
  html_vi: string | null;
  html_en: string | null;
}): Lang[] {
  const langs: Lang[] = ["vi"];
  if (page.html_en && page.html_en.trim().length > 0) langs.push("en");
  return langs;
}
```

- [ ] **Step 4: Chạy → PASS** — `docker compose run --rm web npm test` (Expected: tất cả PASS), rồi:
```bash
git add -A && git commit -m "feat: availableLanguages helper for bilingual pages (TDD)"
```

---

## Task 2: Page queries + save action

**Files:** Create `src/lib/pages/queries.ts`, `src/lib/pages/actions.ts`

- [ ] **Step 1: `queries.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { PageKind } from "@/lib/domain/pages";

export async function getPage(projectId: string, kind: PageKind) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page")
    .select("id,kind,title,published,html_vi,html_en,project_id")
    .eq("project_id", projectId)
    .eq("kind", kind)
    .maybeSingle();
  return data;
}
```

- [ ] **Step 2: `actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePage(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  const slug = String(formData.get("slug")); // "report" | "guide" để revalidate
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("page")
    .update({
      title: String(formData.get("title") ?? "").trim() || "Untitled",
      html_vi: String(formData.get("html_vi") ?? ""),
      html_en: String(formData.get("html_en") ?? "") || null,
      published: formData.get("published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/projects/${projectId}/${slug}`);
}
```

- [ ] **Step 3: Build** — `docker compose run --rm web npm run build` (Expected: OK), rồi:
```bash
git add -A && git commit -m "feat: page queries + savePage action"
```

---

## Task 3: shadcn components + HtmlViewer

**Files:** add shadcn; Create `src/components/html-viewer.tsx`

- [ ] **Step 1: Add components** — `docker compose run --rm web npx --yes shadcn@latest add tabs textarea switch`

- [ ] **Step 2: `html-viewer.tsx`** (iframe sandbox + toggle VI/EN)

```tsx
"use client";

import { useState } from "react";
import { availableLanguages, type Lang } from "@/lib/pages/languages";

export function HtmlViewer({
  htmlVi,
  htmlEn,
}: {
  htmlVi: string | null;
  htmlEn: string | null;
}) {
  const langs = availableLanguages({ html_vi: htmlVi, html_en: htmlEn });
  const [lang, setLang] = useState<Lang>("vi");
  const html = (lang === "en" ? htmlEn : htmlVi) || "";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {langs.length > 1 && (
        <div className="flex justify-end gap-1 border-b border-line bg-brand-bg px-3 py-2">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition ${
                lang === l ? "bg-navy text-white" : "text-muted-foreground hover:bg-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {html.trim() ? (
        <iframe
          title="preview"
          sandbox="allow-scripts allow-popups"
          srcDoc={html}
          className="h-[70vh] w-full bg-white"
        />
      ) : (
        <div className="grid h-[40vh] place-items-center text-sm text-muted-foreground">
          Chưa có nội dung. Dán HTML vào editor và lưu.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build** — `docker compose run --rm web npm run build` (Expected: OK), rồi commit:
```bash
git add -A && git commit -m "feat: add tabs/textarea/switch + HtmlViewer (iframe sandbox + VI/EN toggle)"
```

---

## Task 4: HtmlEditor (VI/EN textarea + live preview + save)

**Files:** Create `src/components/html-editor.tsx`

- [ ] **Step 1: `html-editor.tsx`**

```tsx
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
                  editLang === l ? "bg-navy text-white" : "bg-white text-muted-foreground border border-line"
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
```

> Lưu ý: preview dùng cùng `HtmlViewer` → cập nhật khi state đổi (re-render iframe srcDoc).

- [ ] **Step 2: Build** — `docker compose run --rm web npm run build` (Expected: OK), rồi commit:
```bash
git add -A && git commit -m "feat: HtmlEditor (VI/EN source + live preview + save)"
```

---

## Task 5: Report + Guide route screens

**Files:** Create `src/app/(app)/projects/[id]/report/page.tsx`, `.../guide/page.tsx`

- [ ] **Step 1: `report/page.tsx`**

```tsx
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
```

- [ ] **Step 2: `guide/page.tsx`** (giống report, đổi kind + tiêu đề)

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPage } from "@/lib/pages/queries";
import { HtmlEditor } from "@/components/html-editor";

export default async function GuideEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id, "user_guide");
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
      <h1 className="mt-3 text-2xl font-bold text-navy">Hướng dẫn sử dụng</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Dán HTML self-contained. Hỗ trợ song ngữ VI/EN.
      </p>
      <HtmlEditor page={page} slug="guide" />
    </main>
  );
}
```

- [ ] **Step 3: Build + test toàn bộ**

Run: `docker compose run --rm web npm test && docker compose run --rm web npm run build`
Expected: test PASS, build OK, route `/projects/[id]/report` và `/guide` xuất hiện.

- [ ] **Step 4: Verify thủ công (đăng nhập)**

`docker compose up` → vào 1 project → bấm tab "Report cho sếp" → dán nội dung HTML (vd copy từ `HRM_ODOO_REPORT_VI.html`) vào ô VI → thấy **preview render** (mermaid vẽ) → tick "published" → **Lưu** (toast "Đã lưu"). Reload trang → nội dung vẫn còn. Làm tương tự tab "Hướng dẫn".

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: report + guide editor screens (free-form HTML pages)"
```

---

## Kết quả cuối Plan 3 — verify
1. `/projects/[id]/report` & `/guide` mở được, có editor VI/EN + preview iframe.
2. Dán HTML (kể cả có mermaid/script) → preview render đúng; Lưu → DB `page.html_vi/html_en/published` cập nhật; reload vẫn còn.
3. Toggle VI/EN ở preview hoạt động khi có cả 2 ngôn ngữ.
4. `npm test` PASS, `npm run build` OK.

## Self-Review
- **Spec coverage:** phủ "Report cho sếp" + "Hướng dẫn" = HTML tự do, iframe sandbox, song ngữ VI/EN mặc định VI (mục 2,3,9 spec). `HtmlViewer` tái sử dụng cho viewer công khai `/v/[token]` ở Plan 7.
- **Placeholder scan:** mọi step có code thật; không TODO mơ hồ.
- **Type consistency:** `getPage(projectId, kind)`, `savePage`, `availableLanguages`, `HtmlViewer`/`HtmlEditor` props khớp; cột `html_vi/html_en/published/title` khớp schema Plan 1; `PageKind` import từ `@/lib/domain/pages`.
- **Bảo mật:** iframe `sandbox="allow-scripts allow-popups"` (không `allow-same-origin`) — script chạy nhưng cô lập khỏi app; nội dung do owner tạo.
