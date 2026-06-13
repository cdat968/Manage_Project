# Plan 2 — Projects & Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Quản lý dự án (CRUD) và tính năng (CRUD) — dashboard liệt kê project, tạo project tự sinh 5 trang, trang tổng quan project hiển thị 5 tab trang + danh sách feature có trạng thái.

**Architecture:** Next.js 16 App Router. Đọc dữ liệu bằng Server Components (supabase server client, dùng session owner). Ghi bằng Server Actions + `revalidatePath`. UI dùng shadcn/ui (card, dialog, input, select, dropdown-menu, badge). Logic thuần (slugify, builder 5 trang) tách module test bằng Vitest (TDD).

**Tech Stack:** Như Plan 1 + shadcn components: card, dialog, input, label, select, dropdown-menu, badge, sonner.

---

## Tiền đề
- Chạy mọi lệnh trong Docker (`docker compose run --rm web ...`, `docker compose up`).
- Đã đăng nhập owner (`dat@gmail.com`) — các trang admin nằm sau `proxy.ts`.
- Schema đã có bảng `project`, `feature`, `page` (Plan 1).

## File Structure (Plan 2)
```
src/
  lib/
    domain/
      pages.ts            # PAGE_KINDS, nhãn mặc định, buildDefaultPages() (TDD)
      pages.test.ts
      slug.ts             # slugify() (TDD)
      slug.test.ts
    projects/
      queries.ts          # đọc: listProjects, getProject, getFeatures, getPages
      actions.ts          # ghi (server actions): createProject, updateProject, deleteProject
    features/
      actions.ts          # ghi: createFeature, updateFeature, deleteFeature
  components/
    ui/                   # shadcn add: card,dialog,input,label,select,dropdown-menu,badge,sonner
    project-create-dialog.tsx
    project-card.tsx
    feature-list.tsx
    feature-form-dialog.tsx
    page-tabs.tsx
  app/
    page.tsx              # dashboard (sửa: list + nút tạo)
    layout.tsx            # thêm <Toaster/>
    projects/[id]/page.tsx        # trang tổng quan project
```

---

## Task 1: Domain — slugify (TDD)

**Files:**
- Create: `src/lib/domain/slug.ts`, `src/lib/domain/slug.test.ts`

- [ ] **Step 1: Viết test (FAIL trước)**

`src/lib/domain/slug.test.ts`:
```typescript
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
```

- [ ] **Step 2: Chạy → FAIL**

Run: `docker compose run --rm web npm test src/lib/domain/slug.test.ts`
Expected: FAIL (module chưa có).

- [ ] **Step 3: Implement `slug.ts`**

```typescript
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Chạy → PASS**

Run: `docker compose run --rm web npm test src/lib/domain/slug.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: slugify helper for project slugs (TDD)"
```

---

## Task 2: Domain — page kinds + buildDefaultPages (TDD)

**Files:**
- Create: `src/lib/domain/pages.ts`, `src/lib/domain/pages.test.ts`

- [ ] **Step 1: Viết test (FAIL trước)**

`src/lib/domain/pages.test.ts`:
```typescript
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
```

- [ ] **Step 2: Chạy → FAIL**

Run: `docker compose run --rm web npm test src/lib/domain/pages.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `pages.ts`**

```typescript
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
```

- [ ] **Step 4: Chạy → PASS, rồi commit**

Run: `docker compose run --rm web npm test`
Expected: tất cả PASS.
```bash
git add -A && git commit -m "feat: page kinds + default pages builder (TDD)"
```

---

## Task 3: Cài shadcn components cần cho Plan 2

**Files:** tạo dưới `src/components/ui/` (qua CLI)

- [ ] **Step 1: Add components**

Run:
```bash
docker compose run --rm web npx --yes shadcn@latest add card dialog input label select dropdown-menu badge sonner
```
Expected: tạo các file trong `src/components/ui/`.

- [ ] **Step 2: Gắn `<Toaster/>` vào layout** — sửa `src/app/layout.tsx`, thêm import và đặt `<Toaster />` ngay trước `</body>`:

```tsx
import { Toaster } from "@/components/ui/sonner";
```
và trong JSX, sau `{children}`:
```tsx
        {children}
        <Toaster />
```

- [ ] **Step 3: Build kiểm tra**

Run: `docker compose run --rm web npm run build`
Expected: Compiled successfully.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add shadcn components for projects/features UI"
```

---

## Task 4: Project queries + actions (data layer)

**Files:**
- Create: `src/lib/projects/queries.ts`, `src/lib/projects/actions.ts`

- [ ] **Step 1: Viết `queries.ts`** (đọc bằng server client)

```typescript
import { createClient } from "@/lib/supabase/server";

export async function listProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project")
    .select("id,name,slug,client,status,created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project")
    .select("id,name,slug,client,description,status,created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getPages(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page")
    .select("id,kind,title,published")
    .eq("project_id", projectId);
  return data ?? [];
}

export async function getFeatures(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature")
    .select("id,name,description,status,order")
    .eq("project_id", projectId)
    .order("order", { ascending: true });
  return data ?? [];
}
```

- [ ] **Step 2: Viết `actions.ts`** (server actions ghi dữ liệu; tạo project kèm 5 trang)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/domain/slug";
import { buildDefaultPages } from "@/lib/domain/pages";
import { generateToken } from "@/lib/share/token";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  if (!name) return;

  const supabase = await createClient();
  const base = slugify(name) || "project";

  // chèn project, nếu trùng slug thì thêm hậu tố ngắn
  let slug = base;
  let projectId: string | null = null;
  for (let attempt = 0; attempt < 3 && !projectId; attempt++) {
    const { data, error } = await supabase
      .from("project")
      .insert({ name, client, slug })
      .select("id")
      .single();
    if (!error && data) {
      projectId = data.id;
    } else {
      slug = `${base}-${generateToken().slice(0, 4).toLowerCase()}`;
    }
  }
  if (!projectId) return;

  await supabase.from("page").insert(buildDefaultPages(projectId));
  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function updateProject(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("project").update({ name, client, description }).eq("id", id);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("project").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}
```

- [ ] **Step 3: Build kiểm tra**

Run: `docker compose run --rm web npm run build`
Expected: Compiled successfully (chưa dùng UI nên chỉ check TS).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: project queries + actions (create auto-builds 5 pages)"
```

---

## Task 5: Dashboard — list + create project

**Files:**
- Create: `src/components/project-card.tsx`, `src/components/project-create-dialog.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `project-card.tsx`**

```tsx
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  client: string | null;
  status: string | null;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h3 className="font-semibold text-navy">{project.name}</h3>
      {project.client && (
        <p className="mt-1 text-sm text-muted-foreground">{project.client}</p>
      )}
      <span className="mt-3 inline-block rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
        {project.status ?? "active"}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: `project-create-dialog.tsx`** (client component, dùng dialog + form action)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/projects/actions";

export function ProjectCreateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy text-white hover:bg-navy-deep">+ Dự án mới</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo dự án</DialogTitle>
        </DialogHeader>
        <form action={createProject} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên dự án</Label>
            <Input id="name" name="name" required placeholder="VD: Hệ thống Chấm công" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client">Khách hàng (tuỳ chọn)</Label>
            <Input id="client" name="client" placeholder="VD: TechNext" />
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Tạo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Sửa `src/app/page.tsx`** thành dashboard thật

```tsx
import { listProjects } from "@/lib/projects/queries";
import { ProjectCard } from "@/components/project-card";
import { ProjectCreateDialog } from "@/components/project-create-dialog";

export default async function Dashboard() {
  const projects = await listProjects();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Dự án</h1>
        <ProjectCreateDialog />
      </div>
      {projects.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Chưa có dự án nào. Bấm “Dự án mới”.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Build + verify tạo project (cần đăng nhập)**

Run: `docker compose run --rm web npm run build` → Expected: OK.
Verify thủ công: `docker compose up`, đăng nhập, bấm “Dự án mới”, tạo "Test Project" → chuyển sang `/projects/<id>`.
Verify DB:
```bash
docker compose run --rm web node -e "import('pg').then(async({default:p})=>{const c=new p.Client({connectionString:process.env.DATABASE_URL});await c.connect();const r=await c.query(\"select (select count(*) from project) pj,(select count(*) from page) pg\");console.log(r.rows[0]);await c.end();})"
```
Expected: `pj` ≥ 1 và `pg` = pj×5 (mỗi project 5 trang).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: dashboard project list + create dialog"
```

---

## Task 6: Project overview — info + 5 page tabs + feature list (read-only)

**Files:**
- Create: `src/components/page-tabs.tsx`
- Create: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: `page-tabs.tsx`** (link tới 5 trang con — các trang con sẽ làm ở Plan 3–7, giờ render link)

```tsx
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
```

- [ ] **Step 2: `src/app/projects/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getFeatures } from "@/lib/projects/queries";
import { PageTabs } from "@/components/page-tabs";
import { FeatureList } from "@/components/feature-list";

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const features = await getFeatures(id);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Tất cả dự án
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{project.name}</h1>
      {project.client && (
        <p className="text-sm text-muted-foreground">{project.client}</p>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">
          Trang
        </h2>
        <PageTabs projectId={id} />
      </section>

      <section className="mt-8">
        <FeatureList projectId={id} features={features} />
      </section>
    </main>
  );
}
```

> Lưu ý: `FeatureList` tạo ở Task 7. Làm Task 7 ngay sau để build không lỗi import.

- [ ] **Step 3: Commit (sau khi Task 7 xong build mới pass — commit gộp ở Task 7)**

(không commit riêng; xem Task 7)

---

## Task 7: Feature CRUD

**Files:**
- Create: `src/lib/features/actions.ts`
- Create: `src/components/feature-form-dialog.tsx`, `src/components/feature-list.tsx`

- [ ] **Step 1: `src/lib/features/actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["planned", "in_progress", "done", "blocked"] as const;
type Status = (typeof STATUSES)[number];

function normStatus(v: FormDataEntryValue | null): Status {
  const s = String(v ?? "planned");
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : "planned";
}

export async function createFeature(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) return;
  const supabase = await createClient();
  await supabase.from("feature").insert({
    project_id: projectId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    status: normStatus(formData.get("status")),
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function updateFeature(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("feature")
    .update({
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      status: normStatus(formData.get("status")),
    })
    .eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFeature(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("feature").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
```

- [ ] **Step 2: `feature-form-dialog.tsx`** (dùng cho cả tạo & sửa)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeature, updateFeature } from "@/lib/features/actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "planned", label: "Dự kiến" },
  { value: "in_progress", label: "Đang làm" },
  { value: "done", label: "Xong" },
  { value: "blocked", label: "Vướng" },
];

export function FeatureFormDialog({
  projectId,
  feature,
  trigger,
}: {
  projectId: string;
  feature?: Feature;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(feature);
  const action = editing ? updateFeature : createFeature;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa tính năng" : "Thêm tính năng"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          {feature && <input type="hidden" name="id" value={feature.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên tính năng</Label>
            <Input id="name" name="name" required defaultValue={feature?.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              name="description"
              defaultValue={feature?.description ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Trạng thái</Label>
            <select
              id="status"
              name="status"
              defaultValue={feature?.status ?? "planned"}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Lưu
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: `feature-list.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import { FeatureFormDialog } from "@/components/feature-form-dialog";
import { deleteFeature } from "@/lib/features/actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  planned: { label: "Dự kiến", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "Đang làm", cls: "bg-amber-100 text-amber-700" },
  done: { label: "Xong", cls: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "Vướng", cls: "bg-red-100 text-red-700" },
};

export function FeatureList({
  projectId,
  features,
}: {
  projectId: string;
  features: Feature[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-teal">
          Tính năng
        </h2>
        <FeatureFormDialog
          projectId={projectId}
          trigger={
            <Button size="sm" variant="outline">
              + Thêm
            </Button>
          }
        />
      </div>
      {features.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có tính năng.</p>
      ) : (
        <ul className="space-y-2">
          {features.map((f) => {
            const b = STATUS_BADGE[f.status] ?? STATUS_BADGE.planned;
            return (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{f.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>
                      {b.label}
                    </span>
                  </div>
                  {f.description && (
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FeatureFormDialog
                    projectId={projectId}
                    feature={f}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Sửa
                      </Button>
                    }
                  />
                  <form action={deleteFeature}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <Button size="sm" variant="ghost" className="text-red-600">
                      Xoá
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build kiểm tra**

Run: `docker compose run --rm web npm run build`
Expected: Compiled successfully.

- [ ] **Step 5: Verify thủ công (đăng nhập)**

`docker compose up` → vào 1 project → Tính năng → “+ Thêm” → tạo "Đăng nhập", trạng thái "Đang làm" → thấy item + badge; “Sửa” đổi trạng thái "Xong"; “Xoá” item biến mất.

- [ ] **Step 6: Commit (gộp Task 6 + 7)**

```bash
git add -A && git commit -m "feat: project overview (page tabs) + feature CRUD"
```

---

## Task 8: Edit/Delete project trên trang overview

**Files:**
- Create: `src/components/project-settings.tsx`
- Modify: `src/app/projects/[id]/page.tsx` (gắn nút Sửa/Xoá project)

- [ ] **Step 1: `project-settings.tsx`** (dialog sửa + nút xoá có xác nhận)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject, deleteProject } from "@/lib/projects/actions";

type Project = {
  id: string;
  name: string;
  client: string | null;
  description: string | null;
};

export function ProjectSettings({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cài đặt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cài đặt dự án</DialogTitle>
        </DialogHeader>
        <form action={updateProject} className="space-y-4">
          <input type="hidden" name="id" value={project.id} />
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" required defaultValue={project.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client">Khách hàng</Label>
            <Input id="client" name="client" defaultValue={project.client ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              name="description"
              defaultValue={project.description ?? ""}
            />
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Lưu
          </Button>
        </form>
        <form
          action={deleteProject}
          onSubmit={(e) => {
            if (!confirm("Xoá dự án này và toàn bộ dữ liệu liên quan?")) e.preventDefault();
          }}
          className="border-t border-line pt-4"
        >
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="ghost" className="w-full text-red-600">
            Xoá dự án
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Gắn vào overview** — sửa header trong `src/app/projects/[id]/page.tsx`: bọc tên + nút Cài đặt:

Thay khối:
```tsx
      <h1 className="mt-2 text-2xl font-bold text-navy">{project.name}</h1>
      {project.client && (
        <p className="text-sm text-muted-foreground">{project.client}</p>
      )}
```
bằng:
```tsx
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
          {project.client && (
            <p className="text-sm text-muted-foreground">{project.client}</p>
          )}
        </div>
        <ProjectSettings project={project} />
      </div>
```
và thêm import ở đầu file:
```tsx
import { ProjectSettings } from "@/components/project-settings";
```

- [ ] **Step 3: Build + test toàn bộ**

Run: `docker compose run --rm web npm test && docker compose run --rm web npm run build`
Expected: test PASS, build OK.

- [ ] **Step 4: Verify thủ công**

`docker compose up` → vào project → “Cài đặt” → đổi tên + mô tả → Lưu (tên cập nhật); thử “Xoá dự án” (confirm) → về dashboard, project biến mất.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit/delete project from overview"
```

---

## Kết quả cuối Plan 2 — verify
1. Dashboard liệt kê project, nút “Dự án mới” tạo project + tự sinh 5 trang (DB: page = project×5).
2. Trang `/projects/[id]` hiển thị tên/khách hàng, 5 tab trang (link sang trang con — nội dung ở Plan 3–7), danh sách tính năng.
3. Feature: thêm/sửa/xoá + trạng thái có badge màu.
4. Project: sửa thông tin / xoá (cascade xoá feature + page).
5. `docker compose run --rm web npm test` → tất cả PASS. `npm run build` → OK.

## Self-Review
- **Spec coverage:** Plan 2 phủ mục "1 trang quản lý project", feature làm thực thể trung tâm (gắn TC/Bug sau), 5 trang/project (mục 2 spec). Nội dung từng trang con thuộc Plan 3–7.
- **Placeholder scan:** không có TODO mơ hồ; mọi step có code thật. Trang con `/projects/[id]/<slug>` chưa tồn tại tới Plan 3–7 — link sẽ 404 tạm thời (đã nêu rõ), không phải lỗi.
- **Type consistency:** `PAGE_KINDS/PAGE_LABELS/PAGE_SLUGS` dùng nhất quán; `createProject/updateProject/deleteProject`, `createFeature/updateFeature/deleteFeature` khớp giữa actions và UI; tên cột (`project_id`, `order`, `status`) khớp schema Plan 1.
