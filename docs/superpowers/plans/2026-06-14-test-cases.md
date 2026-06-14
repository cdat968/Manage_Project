# Plan 4 — Test Cases (structured + inline edit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Trang Test Cases là "bảng sống" theo mô hình **template-slot + dữ liệu cấu trúc**: render record TC từ DB, **sửa inline tại chỗ (optimistic)**, **+ Thêm/Xoá TC** (record cũ giữ nguyên, định dạng nhất quán), header **thống kê pass/fail**, **lọc**, và **ảnh evidence** (upload Supabase Storage → thumbnail → lightbox).

**Architecture:** `test_case` (Plan 1) là nguồn dữ liệu. Trang `/projects/[id]/test-cases` render bằng React trong theme TechNext (navy/teal). Sửa inline = client giữ state + gọi **server action** nhỏ (`updateTestCase`/`createTestCase`/`deleteTestCase`); UI đổi ngay (optimistic), không `revalidatePath` để tránh nháy. **Ảnh upload TRỰC TIẾP từ client lên Supabase Storage** (tránh giới hạn 1MB của Server Action — bài học từ case base64). Logic thuần (thống kê, lọc) tách module test (TDD).

**Tech Stack:** Như Plan 2/3 + `@supabase/supabase-js` browser client cho Storage. shadcn `select` (đã có), dialog (đã có) cho lightbox.

**Phạm vi (chốt):** Chỉ trang Test Cases. **Thư viện template (lưu/chọn theme) = plan riêng sau** (khi đã có ≥2 trang có-cấu-trúc); Plan 4 dùng **1 theme built-in** (look TechNext của `Test-Cases-Cham-cong.html`). VI-only.

---

## Tiền đề
- Chạy trong Docker. Đã đăng nhập owner.
- Bảng `test_case` có sẵn (Plan 1). Trang `/projects/[id]/test-cases` hiện **chưa có** (link từ page-tabs đang 404).
- Branch: tạo `feat/test-cases` từ `main` khi thực thi (chốt ở bước execute).

## File Structure (Plan 4)
```
supabase/migrations/0002_evidence_and_tc_images.sql   # bucket evidence + policy + test_case.images
src/lib/test-cases/
  stats.ts / stats.test.ts        # countResults, filterTestCases (TDD)
  queries.ts                      # listTestCases(projectId)
  actions.ts                      # create/update/delete TestCase (server actions)
src/lib/storage/
  evidence.ts                     # uploadEvidence (client), signedUrl (server)
src/components/test-cases/
  test-case-table.tsx             # client: state + optimistic inline + add/delete + stats + filter
  editable-cell.tsx               # ô text sửa inline (click→input→blur lưu)
  result-badge-select.tsx         # select Pass/Fail/Chưa chạy
  evidence-cell.tsx               # thumbnail + upload + lightbox
src/app/(app)/projects/[id]/test-cases/page.tsx
```

---

## Task 1: Migration — bucket evidence + test_case.images

**Files:** Create `supabase/migrations/0002_evidence_and_tc_images.sql`

- [ ] **Step 1: Viết migration**

```sql
-- thêm cột ảnh cho test_case
alter table test_case add column if not exists images jsonb default '[]';

-- bucket lưu ảnh evidence (private)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- owner (authenticated) toàn quyền trên bucket evidence
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'evidence_auth_all') then
    create policy "evidence_auth_all" on storage.objects
      for all to authenticated
      using (bucket_id = 'evidence') with check (bucket_id = 'evidence');
  end if;
end $$;
```

- [ ] **Step 2: Chạy migration** — `docker compose run --rm web npm run migrate`
Expected: `Applying 0002_...` → `Migrations applied.`

- [ ] **Step 3: Xác nhận cột + bucket**
```bash
docker compose run --rm web node -e "import('pg').then(async({default:p})=>{const c=new p.Client({connectionString:process.env.DATABASE_URL});await c.connect();const a=await c.query(\"select count(*) from information_schema.columns where table_name='test_case' and column_name='images'\");const b=await c.query(\"select count(*) from storage.buckets where id='evidence'\");console.log('images_col:',a.rows[0].count,'bucket:',b.rows[0].count);await c.end();})"
```
Expected: `images_col: 1 bucket: 1`.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(db): test_case.images + evidence storage bucket + policy"`

---

## Task 2: Stats & filter helpers (TDD)

**Files:** Create `src/lib/test-cases/stats.ts`, `stats.test.ts`

- [ ] **Step 1: Test (FAIL trước)**

`src/lib/test-cases/stats.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { countResults, filterTestCases, type TestCaseRow } from "./stats";

const rows: TestCaseRow[] = [
  { id: "1", section: "A", type: "positive", result: "pass", summary: "login ok", code: "TC-1" },
  { id: "2", section: "A", type: "boundary", result: "fail", summary: "edge", code: "TC-2" },
  { id: "3", section: "B", type: "positive", result: "not_run", summary: "logout", code: "TC-3" },
] as TestCaseRow[];

describe("countResults", () => {
  it("đếm theo trạng thái", () => {
    expect(countResults(rows)).toEqual({ total: 3, pass: 1, fail: 1, not_run: 1 });
  });
});

describe("filterTestCases", () => {
  it("lọc theo section", () => {
    expect(filterTestCases(rows, { section: "A" }).map((r) => r.id)).toEqual(["1", "2"]);
  });
  it("lọc theo result", () => {
    expect(filterTestCases(rows, { result: "fail" }).map((r) => r.id)).toEqual(["2"]);
  });
  it("tìm theo từ khoá (summary/code, không phân biệt hoa thường)", () => {
    expect(filterTestCases(rows, { q: "LOGIN" }).map((r) => r.id)).toEqual(["1"]);
  });
  it("không filter -> trả nguyên", () => {
    expect(filterTestCases(rows, {})).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Chạy → FAIL** — `docker compose run --rm web npm test src/lib/test-cases/stats.test.ts`

- [ ] **Step 3: Implement `stats.ts`**

```typescript
export type TcResult = "pass" | "fail" | "not_run";
export type TcType = "positive" | "boundary" | "business" | "negative";

export type TestCaseRow = {
  id: string;
  project_id: string;
  feature_id: string | null;
  section: string | null;
  code: string | null;
  type: TcType;
  summary: string | null;
  precondition: string | null;
  steps: unknown;
  expected: string | null;
  result: TcResult;
  note: string | null;
  images: string[];
  order: number;
};

export function countResults(rows: Pick<TestCaseRow, "result">[]) {
  const out = { total: rows.length, pass: 0, fail: 0, not_run: 0 };
  for (const r of rows) out[r.result]++;
  return out;
}

export type TcFilter = { section?: string; type?: TcType; result?: TcResult; q?: string };

export function filterTestCases<T extends Pick<TestCaseRow, "section" | "type" | "result" | "summary" | "code">>(
  rows: T[],
  f: TcFilter,
): T[] {
  const q = f.q?.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.section && r.section !== f.section) return false;
    if (f.type && r.type !== f.type) return false;
    if (f.result && r.result !== f.result) return false;
    if (q) {
      const hay = `${r.summary ?? ""} ${r.code ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: Chạy → PASS** — `docker compose run --rm web npm test` (tất cả PASS), rồi:
```bash
git add -A && git commit -m "feat: test-case stats + filter helpers (TDD)"
```

---

## Task 3: Queries + Server Actions

**Files:** Create `src/lib/test-cases/queries.ts`, `src/lib/test-cases/actions.ts`

- [ ] **Step 1: `queries.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { TestCaseRow } from "./stats";

export async function listTestCases(projectId: string): Promise<TestCaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_case")
    .select("id,project_id,feature_id,section,code,type,summary,precondition,steps,expected,result,note,images,order")
    .eq("project_id", projectId)
    .order("order", { ascending: true })
    .order("code", { ascending: true });
  return (data ?? []) as TestCaseRow[];
}
```

- [ ] **Step 2: `actions.ts`** (trả về row mới để client cập nhật state; update nhận patch từng phần)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import type { TestCaseRow } from "./stats";

const EDITABLE = [
  "section", "code", "type", "summary", "precondition", "expected", "result", "note", "images",
] as const;
type EditableField = (typeof EDITABLE)[number];

export async function createTestCase(projectId: string): Promise<TestCaseRow | null> {
  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("test_case")
    .select("order")
    .eq("project_id", projectId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.order ?? 0) + 1;

  const { data } = await supabase
    .from("test_case")
    .insert({ project_id: projectId, code: `TC-${nextOrder}`, summary: "", type: "positive", result: "not_run", order: nextOrder })
    .select("id,project_id,feature_id,section,code,type,summary,precondition,steps,expected,result,note,images,order")
    .single();
  return (data ?? null) as TestCaseRow | null;
}

export async function updateTestCase(
  id: string,
  patch: Partial<Record<EditableField, unknown>>,
): Promise<void> {
  const clean: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in patch) clean[k] = patch[k];
  if (Object.keys(clean).length === 0) return;
  const supabase = await createClient();
  await supabase.from("test_case").update(clean).eq("id", id);
}

export async function deleteTestCase(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("test_case").delete().eq("id", id);
}
```

- [ ] **Step 3: Build** — `docker compose run --rm web npm run build` (OK), rồi:
```bash
git add -A && git commit -m "feat: test-case queries + create/update/delete actions"
```

---

## Task 4: Storage helpers (upload client + signed URL)

**Files:** Create `src/lib/storage/evidence.ts`

- [ ] **Step 1: `evidence.ts`**

```typescript
import { createClient } from "@/lib/supabase/client";
import { generateToken } from "@/lib/share/token";

// Upload TRỰC TIẾP từ browser -> Storage (tránh giới hạn 1MB Server Action)
export async function uploadEvidence(
  projectId: string,
  tcId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${projectId}/test_cases/${tcId}/${generateToken().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage.from("evidence").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function signedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("evidence").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
```

- [ ] **Step 2: Build** — `docker compose run --rm web npm run build` (OK), rồi:
```bash
git add -A && git commit -m "feat: evidence storage helpers (direct client upload + signed url)"
```

---

## Task 5: EditableCell + ResultBadgeSelect

**Files:** Create `src/components/test-cases/editable-cell.tsx`, `result-badge-select.tsx`

- [ ] **Step 1: `editable-cell.tsx`** (click → input/textarea → blur lưu; optimistic do parent giữ state)

```tsx
"use client";

import { useState } from "react";

export function EditableCell({
  value,
  onSave,
  multiline = false,
  placeholder = "—",
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`w-full cursor-text rounded px-1.5 py-1 text-left hover:bg-teal/5 ${className}`}
      >
        {value ? (
          <span className="whitespace-pre-wrap">{value}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </button>
    );
  }

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const common =
    "w-full rounded border border-teal bg-white px-1.5 py-1 text-sm outline-none ring-2 ring-teal/20";
  return multiline ? (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      rows={3}
      className={common}
    />
  ) : (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className={common}
    />
  );
}
```

- [ ] **Step 2: `result-badge-select.tsx`**

```tsx
"use client";

import type { TcResult } from "@/lib/test-cases/stats";

const OPTS: { v: TcResult; label: string; cls: string }[] = [
  { v: "pass", label: "Pass", cls: "bg-emerald-100 text-emerald-700" },
  { v: "fail", label: "Fail", cls: "bg-red-100 text-red-700" },
  { v: "not_run", label: "Chưa chạy", cls: "bg-slate-100 text-slate-600" },
];

export function ResultBadgeSelect({
  value,
  onChange,
}: {
  value: TcResult;
  onChange: (v: TcResult) => void;
}) {
  const cur = OPTS.find((o) => o.v === value) ?? OPTS[2];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TcResult)}
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cur.cls}`}
    >
      {OPTS.map((o) => (
        <option key={o.v} value={o.v}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Build OK → commit**
```bash
git add -A && git commit -m "feat: editable cell + result badge select (inline edit primitives)"
```

---

## Task 6: EvidenceCell (upload + thumbnail + lightbox)

**Files:** Create `src/components/test-cases/evidence-cell.tsx`

- [ ] **Step 1: `evidence-cell.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { uploadEvidence, signedUrl } from "@/lib/storage/evidence";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

export function EvidenceCell({
  projectId,
  tcId,
  images,
  onChange,
}: {
  projectId: string;
  tcId: string;
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        images.map(async (p) => [p, (await signedUrl(p)) ?? ""] as const),
      );
      if (active) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
  }, [images]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadEvidence(projectId, tcId, file);
      onChange([...images, path]);
    } catch {
      toast.error("Upload lỗi");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {images.map((p) => (
        <button
          key={p}
          onClick={() => setOpen(urls[p] ?? null)}
          className="size-9 overflow-hidden rounded border border-line bg-brand-bg"
        >
          {urls[p] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urls[p]} alt="evidence" className="size-full object-cover" />
          ) : null}
        </button>
      ))}
      <label className="grid size-9 cursor-pointer place-items-center rounded border border-dashed border-line text-muted-foreground hover:border-teal hover:text-teal">
        {busy ? "…" : "+"}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          {open && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={open} alt="evidence" className="h-auto w-full rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Build OK → commit**
```bash
git add -A && git commit -m "feat: evidence cell (direct upload + thumbnail + lightbox)"
```

---

## Task 7: TestCaseTable (state + optimistic inline + add/delete + stats + filter)

**Files:** Create `src/components/test-cases/test-case-table.tsx`

- [ ] **Step 1: `test-case-table.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditableCell } from "./editable-cell";
import { ResultBadgeSelect } from "./result-badge-select";
import { EvidenceCell } from "./evidence-cell";
import { countResults, filterTestCases, type TestCaseRow, type TcResult, type TcType } from "@/lib/test-cases/stats";
import { createTestCase, updateTestCase, deleteTestCase } from "@/lib/test-cases/actions";
import { toast } from "sonner";

const TYPES: TcType[] = ["positive", "boundary", "business", "negative"];

export function TestCaseTable({
  projectId,
  initial,
}: {
  projectId: string;
  initial: TestCaseRow[];
}) {
  const [rows, setRows] = useState<TestCaseRow[]>(initial);
  const [q, setQ] = useState("");
  const [fResult, setFResult] = useState<TcResult | "">("");

  const stats = useMemo(() => countResults(rows), [rows]);
  const view = useMemo(
    () => filterTestCases(rows, { q: q || undefined, result: fResult || undefined }),
    [rows, q, fResult],
  );

  // optimistic: đổi state ngay, gọi action ngầm; lỗi -> rollback + toast
  function patch(id: string, p: Partial<TestCaseRow>) {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    updateTestCase(id, p as Record<string, unknown>).catch(() => {
      setRows(prev);
      toast.error("Lưu lỗi");
    });
  }

  async function addRow() {
    const created = await createTestCase(projectId);
    if (created) setRows((rs) => [...rs, created]);
    else toast.error("Thêm lỗi");
  }

  function removeRow(id: string) {
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== id));
    deleteTestCase(id).catch(() => {
      setRows(prev);
      toast.error("Xoá lỗi");
    });
  }

  return (
    <div className="space-y-4">
      {/* stats + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg bg-navy/5 px-3 py-1 font-semibold text-navy">{stats.total} TC</span>
          <span className="rounded-lg bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{stats.pass} Pass</span>
          <span className="rounded-lg bg-red-50 px-3 py-1 font-semibold text-red-700">{stats.fail} Fail</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-600">{stats.not_run} Chưa chạy</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã/summary..." className="h-9 w-52" />
          <select
            value={fResult}
            onChange={(e) => setFResult(e.target.value as TcResult | "")}
            className="h-9 rounded-lg border border-line px-2 text-sm"
          >
            <option value="">Tất cả KQ</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="not_run">Chưa chạy</option>
          </select>
          <Button onClick={addRow} className="bg-navy text-white hover:bg-navy-deep">+ Thêm TC</Button>
        </div>
      </div>

      {/* bảng theo theme TechNext */}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-navy/5 text-left text-xs uppercase tracking-wide text-navy">
              <th className="w-24 px-3 py-2">Mã</th>
              <th className="w-28 px-3 py-2">Type</th>
              <th className="px-3 py-2">Summary</th>
              <th className="px-3 py-2">Expected</th>
              <th className="w-28 px-3 py-2">Kết quả</th>
              <th className="w-40 px-3 py-2">Ảnh</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} className="border-t border-line align-top hover:bg-brand-bg/40">
                <td className="px-2 py-1.5 font-mono text-xs text-navy">
                  <EditableCell value={r.code ?? ""} onSave={(v) => patch(r.id, { code: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={r.type}
                    onChange={(e) => patch(r.id, { type: e.target.value as TcType })}
                    className="rounded border border-line px-1 py-0.5 text-xs"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <EditableCell value={r.summary ?? ""} multiline onSave={(v) => patch(r.id, { summary: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <EditableCell value={r.expected ?? ""} multiline onSave={(v) => patch(r.id, { expected: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <ResultBadgeSelect value={r.result} onChange={(v) => patch(r.id, { result: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <EvidenceCell
                    projectId={projectId}
                    tcId={r.id}
                    images={r.images ?? []}
                    onChange={(imgs) => patch(r.id, { images: imgs })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(r.id)} className="text-red-500 hover:text-red-700">✕</button>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  Chưa có test case. Bấm “+ Thêm TC”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build OK → commit**
```bash
git add -A && git commit -m "feat: TestCaseTable — optimistic inline edit + add/delete + stats + filter"
```

---

## Task 8: Route page + wiring

**Files:** Create `src/app/(app)/projects/[id]/test-cases/page.tsx`

- [ ] **Step 1: `page.tsx`**

```tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listTestCases } from "@/lib/test-cases/queries";
import { TestCaseTable } from "@/components/test-cases/test-case-table";

export default async function TestCasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await listTestCases(id);

  return (
    <main className="mx-auto max-w-[1400px] px-8 py-10">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
      >
        <ChevronLeft className="size-4" />
        Về dự án
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy">Test Cases</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Bảng sống — sửa trực tiếp trên ô, ảnh evidence, thống kê pass/fail.
      </p>
      <TestCaseTable projectId={id} initial={rows} />
    </main>
  );
}
```

- [ ] **Step 2: Build + test toàn bộ**

Run: `docker compose run --rm web npm test && docker compose run --rm web npm run build`
Expected: test PASS, build OK, route `/projects/[id]/test-cases` xuất hiện.

- [ ] **Step 3: Verify thủ công (đăng nhập)**

`docker compose up` → vào project → tab **Test Cases**:
- Bấm **+ Thêm TC** → xuất hiện dòng `TC-1` (record cũ giữ nguyên khi thêm tiếp).
- Click ô **Summary/Expected/Mã** → gõ → click ra ngoài → **lưu** (reload vẫn còn).
- Đổi **Kết quả** Pass/Fail → **header thống kê đổi ngay** (vd `1 Pass`).
- Ô **Ảnh** → bấm `+` chọn ảnh → thumbnail hiện → click thumbnail → **lightbox** phóng to.
- **Lọc** theo kết quả / gõ từ khoá → bảng lọc đúng.
- Bấm **✕** xoá dòng → biến mất (reload vẫn mất).

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: test-cases page (structured living table)"`

---

## Kết quả cuối Plan 4 — verify
1. `/projects/[id]/test-cases` render bảng theme TechNext.
2. Thêm/sửa/xoá TC inline, **record cũ giữ nguyên, định dạng nhất quán** (mỗi dòng cùng khuôn).
3. Sửa ô → đổi ngay (optimistic), lưu DB; reload vẫn còn; lỗi → rollback + toast.
4. Thống kê pass/fail/not_run cập nhật realtime theo state; lọc theo kết quả/từ khoá.
5. Ảnh evidence: upload thẳng Storage (không vướng 1MB), thumbnail + lightbox.
6. `npm test` PASS, `npm run build` OK.

## Self-Review
- **Spec coverage (Revision 2):** TC = họ có-cấu-trúc, template-slot (theme built-in) + dữ liệu record + inline optimistic + thêm/xoá + stats + lọc + evidence. Khớp mục 2/3/9. Thư viện template (lưu/chọn theme) đẩy sang plan riêng — ghi rõ trong Phạm vi.
- **Placeholder scan:** mọi step có code thật; route con khác (bug/changelog/guide) ngoài phạm vi plan này.
- **Type consistency:** `TestCaseRow`/`TcResult`/`TcType` dùng nhất quán giữa stats/queries/actions/UI; `createTestCase/updateTestCase/deleteTestCase` khớp; cột khớp schema (`images` thêm ở migration 0002).
- **Bài học áp dụng:** ảnh upload **trực tiếp client → Storage** (không qua Server Action) để tránh giới hạn 1MB đã gặp ở case base64.
- **Bảo mật:** Storage bucket `evidence` private; admin đọc qua signed URL; policy chỉ cho `authenticated`. Viewer công khai (Plan 7) sẽ sinh signed URL ở server.
