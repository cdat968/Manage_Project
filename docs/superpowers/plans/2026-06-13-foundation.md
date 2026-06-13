# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền tảng chạy được của Project Management & Reporting Hub — Next.js chạy hoàn toàn trong Docker, kết nối Supabase, có schema DB đầy đủ, đăng nhập owner, cô lập route, dashboard rỗng và viewer stub.

**Architecture:** Một app Next.js (App Router, TypeScript) chạy trong container Docker (deps nằm trong named volume, không cài lên máy). Supabase cloud free-tier làm Postgres + Auth + Storage. Middleware chặn mọi route trừ `/login` và `/v/[token]`. Logic thuần (hash mật khẩu, sinh token) tách thành module test được bằng Vitest (TDD).

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · **shadcn/ui** (component khu admin) · `@supabase/supabase-js` + `@supabase/ssr` · `pg` (migration runner) · `bcryptjs` · `nanoid` · Vitest + Testing Library · Docker + Docker Compose.

**UI:** Khu admin dùng **shadcn/ui** (table/dialog/dropdown/badge…), khởi tạo trong Plan 1, `add` component theo nhu cầu ở các plan sau. Trang **report & viewer gửi ra ngoài** vẫn render theo design system tùy biến (navy/teal/gold + mermaid) để giống file mẫu. Guidance: skill `vercel:shadcn`, `vercel:nextjs`, `vercel:react-best-practices`.

---

## Roadmap (chuỗi plan — plan này là #1)

| Plan | Nội dung | Kết quả chạy được độc lập |
|------|----------|---------------------------|
| **1. Foundation** *(plan này)* | Docker dev, scaffold, CLAUDE.md + tracking, Supabase, schema + RLS, auth, middleware, dashboard rỗng, viewer stub | Đăng nhập được, dashboard rỗng, route được bảo vệ |
| 2. Projects & Features | CRUD project + feature, dashboard list, trang tổng quan 5 tab | Tạo/sửa project & feature |
| 3. Free-form pages | Editor HTML (VI/EN) cho Report + Hướng dẫn, render iframe sandbox | Soạn & xem 2 trang HTML |
| 4. Test Cases tracker | Bảng sống, thống kê pass/fail, lọc, evidence ảnh | Quản lý TC thật |
| 5. Bug tracker | Bảng → modal → gallery evidence (S/P, expected/observed) | Quản lý bug thật |
| 6. Changelog | Timeline gom theo feature | Quản lý nhật ký |
| 7. Sharing & viewer | Share link, `/v/[token]`, mật khẩu/hạn/thu hồi, signed URL, cô lập hoàn toàn | Gửi link cho người ngoài xem |

Plan 1 dưới đây được viết đầy đủ. Các plan 2–7 sẽ viết riêng sau khi bạn duyệt.

---

## Lưu ý chạy lệnh (mọi thứ trong Docker)

- Khởi động dev: `docker compose up` → app tại `http://localhost:3000`.
- Chạy lệnh một lần (install, test, script): `docker compose run --rm web <lệnh>`.
- KHÔNG chạy `npm` trực tiếp trên máy. node/npm local chỉ dùng cho `create-next-app` ở Task 1 Step 1 (vì cần scaffold trước khi có Dockerfile), sau đó mọi thứ vào container.

---

## File Structure (tạo trong Plan 1)

```
Testing_WEB/
  CLAUDE.md                      # hướng dẫn cho agent + quy ước dự án
  CHANGELOG.md                   # file tracking các lần chỉnh sửa (bắt buộc)
  README.md                      # cách chạy bằng Docker
  .gitignore
  .env.local                     # khóa Supabase (KHÔNG commit)
  .env.example                   # mẫu khóa
  Dockerfile
  docker-compose.yml
  .dockerignore
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  vitest.setup.ts
  middleware.ts                  # cô lập route
  postcss.config.mjs
  components.json                # cấu hình shadcn/ui
  src/
    components/ui/               # component shadcn (add dần)
    lib/utils.ts                 # cn() helper của shadcn
    app/
      globals.css                # Tailwind v4 + shadcn base + design tokens (navy/teal/gold)
      layout.tsx
      page.tsx                   # dashboard rỗng (đã đăng nhập)
      login/page.tsx             # form đăng nhập owner
      login/actions.ts           # server action: signIn
      v/[token]/page.tsx         # viewer stub (404 cho token lạ)
    lib/
      supabase/client.ts         # browser client
      supabase/server.ts         # server client (cookies)
      supabase/admin.ts          # service-role client (server-only)
      auth/password.ts           # hashPassword / verifyPassword (TDD)
      auth/password.test.ts
      share/token.ts             # generateToken (TDD)
      share/token.test.ts
  supabase/
    migrations/
      0001_init.sql              # toàn bộ bảng + enum + RLS
  scripts/
    migrate.mjs                  # chạy migration qua `pg` (trong container)
```

---

## Task 0: Project setup — CLAUDE.md + tracking + git hygiene

**Files:**
- Create: `CLAUDE.md`
- Create: `CHANGELOG.md`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Tạo `.gitignore`**

```gitignore
# deps & build
node_modules/
.next/
out/
dist/

# env
.env*.local
.env

# misc
.DS_Store
*.log
coverage/
```

- [ ] **Step 2: Tạo `CLAUDE.md`** (hướng dẫn cho mọi agent làm việc trong repo)

```markdown
# CLAUDE.md — Project Management & Reporting Hub

## Dự án
Web app quản lý nhiều project; mỗi project có 5 trang (Report cho sếp, Hướng dẫn,
Test Cases, Bug Tickets, Nhật ký). Owner quản lý tất cả; người ngoài chỉ xem được
đúng 1 trang qua link bí mật `/v/[token]`. Spec: `docs/superpowers/specs/2026-06-13-project-mgmt-hub-design.md`.

## Quy tắc môi trường (BẮT BUỘC)
- Dev chạy HOÀN TOÀN trong Docker. KHÔNG cài/chạy npm trực tiếp trên máy.
- Khởi động: `docker compose up`. Lệnh một lần: `docker compose run --rm web <cmd>`.
- Test: `docker compose run --rm web npm test`.

## Quy tắc code
- TypeScript strict. Next.js App Router. Tailwind v4 (tokens trong globals.css).
- TDD cho mọi logic thuần (lib/**). Frequent commits, message rõ ràng.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) CHỈ dùng ở server (`lib/supabase/admin.ts`),
  TUYỆT ĐỐI không import vào client component.

## Tracking
- Mỗi thay đổi đáng kể PHẢI ghi 1 dòng vào `CHANGELOG.md` (mục [Unreleased]).

## Bảo mật cô lập
- `middleware.ts` chặn mọi route trừ `/login`, `/v/*`, asset tĩnh.
- Trang `/v/[token]` chỉ đọc DB qua server bằng admin client, trả đúng 1 page.
```

- [ ] **Step 3: Tạo `CHANGELOG.md`** (file tracking các lần chỉnh sửa)

```markdown
# Changelog

Mọi thay đổi đáng kể của dự án được ghi tại đây. Định dạng theo Keep a Changelog.

## [Unreleased]

### Added
- Khởi tạo dự án: CLAUDE.md, CHANGELOG.md, .gitignore (Plan 1 / Task 0).
```

- [ ] **Step 4: Tạo `.env.example`**

```bash
# Supabase (lấy ở Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct Postgres connection (Project Settings → Database → Connection string → URI)
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_REF.supabase.co:5432/postgres
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md CHANGELOG.md .gitignore .env.example
git commit -m "chore: project scaffolding — CLAUDE.md, CHANGELOG tracking, gitignore"
```

---

## Task 1: Next.js scaffold + Docker dev environment

**Files:**
- Create (scaffold): `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Create: `README.md`

- [ ] **Step 1: Scaffold Next.js vào thư mục hiện tại** (lần duy nhất dùng npx local)

Run:
```bash
npx --yes create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack --use-npm
```
Expected: tạo `package.json`, `src/app/*`, `tailwind`/`postcss` config. Nếu hỏi ghi đè file đã có (README), chọn không ghi đè CHANGELOG/CLAUDE.

- [ ] **Step 2: Tạo `.dockerignore`**

```dockerignore
node_modules
.next
.git
.env*.local
coverage
```

- [ ] **Step 3: Tạo `Dockerfile`**

```dockerfile
FROM node:22-alpine
WORKDIR /app
# deps cache layer
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 4: Tạo `docker-compose.yml`**

```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - node_modules:/app/node_modules
    env_file:
      - .env.local
    command: npm run dev
volumes:
  node_modules:
```

- [ ] **Step 5: Đảm bảo `package.json` có script `dev` mở host** (sửa nếu cần)

Trong `package.json`, script `dev` phải bind 0.0.0.0 để truy cập từ ngoài container:
```json
"scripts": {
  "dev": "next dev -H 0.0.0.0 -p 3000",
  "build": "next build",
  "start": "next start -H 0.0.0.0 -p 3000",
  "lint": "next lint",
  "test": "vitest run",
  "migrate": "node scripts/migrate.mjs"
}
```

- [ ] **Step 6: Tạo `README.md`**

```markdown
# Project Management & Reporting Hub

Web app quản lý report theo project + chia sẻ link bí mật. Dev chạy trong Docker.

## Chạy
1. Copy `.env.example` → `.env.local`, điền khóa Supabase.
2. `docker compose run --rm web npm install` (lần đầu).
3. `docker compose run --rm web npm run migrate` (tạo schema).
4. `docker compose up` → mở http://localhost:3000.

## Test
`docker compose run --rm web npm test`
```

- [ ] **Step 7: Build & chạy thử trong Docker**

Run:
```bash
docker compose up --build -d && sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```
Expected: in ra `200` (trang Next.js mặc định). Sau đó: `docker compose down`.

- [ ] **Step 8: Ghi CHANGELOG + commit**

Thêm vào `CHANGELOG.md` mục Added: "Scaffold Next.js + Docker dev environment."
```bash
git add -A
git commit -m "feat: Next.js scaffold running in Docker"
```

---

## Task 2: Vitest setup (hạ tầng TDD)

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/lib/sanity.test.ts`
- Modify: `package.json` (thêm devDeps)

- [ ] **Step 1: Cài devDeps trong container**

Run:
```bash
docker compose run --rm web npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Tạo `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Tạo `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Viết test sanity (phải fail trước)**

`src/lib/sanity.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { add } from "./sanity";

describe("sanity", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

- [ ] **Step 5: Chạy test, xác nhận FAIL**

Run: `docker compose run --rm web npm test`
Expected: FAIL — `Cannot find module './sanity'`.

- [ ] **Step 6: Tạo implementation tối thiểu**

`src/lib/sanity.ts`:
```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

- [ ] **Step 7: Chạy test, xác nhận PASS**

Run: `docker compose run --rm web npm test`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: configure Vitest with sanity test"
```

---

## Task 3: shadcn/ui init + brand design tokens (navy/teal/gold)

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `src/app/globals.css`

> Guidance: dùng skill `vercel:shadcn` khi chạy task này để bám đúng quy trình hiện hành.

- [ ] **Step 1: Khởi tạo shadcn/ui trong container**

Run: `docker compose run --rm web npx --yes shadcn@latest init -d`
- `-d` = nhận default (style mặc định, base color neutral, CSS variables).
- Tạo `components.json`, `src/lib/utils.ts`, và viết lại `globals.css` theo cấu trúc shadcn (Tailwind v4: `@import "tailwindcss"`, `@theme inline`, các CSS var `--background`, `--foreground`, `--primary`…).
- Nếu hỏi alias, giữ `@/components`, `@/lib/utils`.

- [ ] **Step 2: Thêm brand tokens vào `globals.css`** (chèn THÊM khối `@theme` brand bên dưới phần shadcn tạo — không xoá var của shadcn)

```css
/* === Brand tokens (TechNext report design system) === */
@theme {
  --color-ink: #0f1f33;
  --color-muted: #5b6b7e;
  --color-line: #e2e8f0;
  --color-navy: #0f3a63;
  --color-navy-deep: #0b2c4d;
  --color-teal: #0d9488;
  --color-gold: #c5a059;
  --color-brand-bg: #f6f8fb;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
}
```

- [ ] **Step 3: Thêm component `button` để xác nhận shadcn hoạt động**

Run: `docker compose run --rm web npx --yes shadcn@latest add button`
Expected: tạo `src/components/ui/button.tsx`.

- [ ] **Step 4: Xác nhận build không lỗi**

Run: `docker compose run --rm web npm run build`
Expected: build thành công (Compiled successfully).

- [ ] **Step 5: Ghi CHANGELOG + commit**

Thêm CHANGELOG: "Init shadcn/ui + brand design tokens (navy/teal/gold)."
```bash
git add -A
git commit -m "feat: init shadcn/ui + brand design tokens"
```

---

## Task 4: Password & token utilities (TDD)

**Files:**
- Create: `src/lib/auth/password.ts`, `src/lib/auth/password.test.ts`
- Create: `src/lib/share/token.ts`, `src/lib/share/token.test.ts`

- [ ] **Step 1: Cài deps**

Run: `docker compose run --rm web npm install bcryptjs nanoid && docker compose run --rm web npm install -D @types/bcryptjs`

- [ ] **Step 2: Viết test cho password (FAIL trước)**

`src/lib/auth/password.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("s3cret");
    expect(hash).not.toBe("s3cret");
    expect(await verifyPassword("s3cret", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("s3cret");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Chạy test → FAIL**

Run: `docker compose run --rm web npm test src/lib/auth/password.test.ts`
Expected: FAIL — module không tồn tại.

- [ ] **Step 4: Implement `password.ts`**

```typescript
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 5: Chạy test → PASS**

Run: `docker compose run --rm web npm test src/lib/auth/password.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Viết test cho token (FAIL trước)**

`src/lib/share/token.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generateToken } from "./token";

describe("generateToken", () => {
  it("returns a 24-char url-safe token", () => {
    const t = generateToken();
    expect(t).toHaveLength(24);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns unique tokens", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});
```

- [ ] **Step 7: Chạy test → FAIL**

Run: `docker compose run --rm web npm test src/lib/share/token.test.ts`
Expected: FAIL.

- [ ] **Step 8: Implement `token.ts`**

```typescript
import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const nano = customAlphabet(alphabet, 24);

export function generateToken(): string {
  return nano();
}
```

- [ ] **Step 9: Chạy test → PASS, rồi commit**

Run: `docker compose run --rm web npm test`
Expected: tất cả PASS.
```bash
git add -A
git commit -m "feat: password hashing + share token utilities (TDD)"
```

---

## Task 5: Database schema migration (toàn bộ bảng + RLS)

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `scripts/migrate.mjs`

- [ ] **Step 1: Viết `supabase/migrations/0001_init.sql`**

```sql
-- Enums
create type page_kind as enum ('exec_report','user_guide','test_cases','bugs','changelog');
create type feature_status as enum ('planned','in_progress','done','blocked');
create type tc_type as enum ('positive','boundary','business','negative');
create type tc_result as enum ('pass','fail','not_run');
create type bug_severity as enum ('S1','S2','S3','S4');
create type bug_priority as enum ('P1','P2','P3','P4');
create type bug_status as enum ('new','in_progress','fixed','wont_fix');
create type share_label as enum ('colleague','manager','boss');

-- Tables
create table project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  client text,
  description text,
  status text default 'active',
  cover_url text,
  created_at timestamptz default now()
);

create table feature (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  description text,
  status feature_status default 'planned',
  "order" int default 0
);

create table page (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  kind page_kind not null,
  title text not null,
  published boolean default false,
  html_vi text,
  html_en text,
  updated_at timestamptz default now(),
  unique (project_id, kind)
);

create table test_case (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  section text,
  code text,
  type tc_type default 'positive',
  summary text,
  precondition text,
  steps jsonb default '[]',
  expected text,
  result tc_result default 'not_run',
  note text,
  "order" int default 0
);

create table bug (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  code text,
  summary text,
  description text,
  expected text,
  observed text,
  severity bug_severity default 'S3',
  priority bug_priority default 'P3',
  status bug_status default 'new',
  suggested_fix text,
  steps jsonb default '[]',
  fixed_at timestamptz,
  "order" int default 0
);

create table changelog_entry (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  entry_date date default now(),
  title text not null,
  status text,
  body text,
  commit_refs text[] default '{}',
  "order" int default 0
);

create table share_link (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page(id) on delete cascade,
  token text unique not null,
  label share_label default 'colleague',
  recipient_note text,
  password_hash text,
  expires_at timestamptz,
  revoked boolean default false,
  view_count int default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: chỉ owner (authenticated) thao tác. Viewer công khai đọc qua service role (bypass RLS).
do $$
declare t text;
begin
  foreach t in array array['project','feature','page','test_case','bug','changelog_entry','share_link']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$create policy "owner_all_%1$s" on %1$I
      for all to authenticated using (true) with check (true);$f$, t);
  end loop;
end $$;
```

- [ ] **Step 2: Viết `scripts/migrate.mjs`** (chạy mọi file trong supabase/migrations theo thứ tự)

```javascript
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const dir = path.resolve("supabase/migrations");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const sql = await readFile(path.join(dir, f), "utf8");
  console.log(`Applying ${f}...`);
  await client.query(sql);
}
await client.end();
console.log("Migrations applied.");
```

- [ ] **Step 3: Cài `pg`**

Run: `docker compose run --rm web npm install pg`

- [ ] **Step 4: MISSING SETUP — tạo Supabase project & điền `.env.local`**

Thủ công (báo cho user): tạo project tại supabase.com → copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` vào `.env.local` (theo `.env.example`).

- [ ] **Step 5: Chạy migration**

Run: `docker compose run --rm web npm run migrate`
Expected: in `Applying 0001_init.sql...` rồi `Migrations applied.`

- [ ] **Step 6: Xác nhận bảng tồn tại**

Run:
```bash
docker compose run --rm web node -e "import('pg').then(async({default:pg})=>{const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();const r=await c.query(\"select count(*) from information_schema.tables where table_name in ('project','page','bug','share_link')\");console.log('tables:',r.rows[0].count);await c.end();})"
```
Expected: `tables: 4`.

- [ ] **Step 7: Ghi CHANGELOG + commit**

```bash
git add -A
git commit -m "feat: database schema (all tables + enums + RLS) with pg migration runner"
```

---

## Task 6: Supabase clients

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`

- [ ] **Step 1: Cài `@supabase/ssr` + `@supabase/supabase-js`**

Run: `docker compose run --rm web npm install @supabase/ssr @supabase/supabase-js`

- [ ] **Step 2: Browser client `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Server client `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component — ignore (middleware refreshes)
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Admin (service-role) client `src/lib/supabase/admin.ts`** (server-only)

```typescript
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 5: Cài `server-only`**

Run: `docker compose run --rm web npm install server-only`

- [ ] **Step 6: Xác nhận build**

Run: `docker compose run --rm web npm run build`
Expected: build OK.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Supabase browser/server/admin clients"
```

---

## Task 7: Auth login + middleware cô lập route

**Files:**
- Create: `middleware.ts`
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`

- [ ] **Step 1: Tạo `middleware.ts`** (refresh session + chặn route)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/login", "/v/"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 2: Tạo server action `src/app/login/actions.ts`**

```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
}
```

- [ ] **Step 3: Tạo `src/app/login/page.tsx`**

```tsx
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center">
      <form action={signIn} className="w-80 space-y-4 rounded-2xl border border-line bg-white p-8 shadow">
        <h1 className="text-xl font-bold text-navy">Đăng nhập</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input name="email" type="email" required placeholder="Email"
          className="w-full rounded-lg border border-line px-3 py-2" />
        <input name="password" type="password" required placeholder="Mật khẩu"
          className="w-full rounded-lg border border-line px-3 py-2" />
        <button type="submit"
          className="w-full rounded-lg bg-navy px-3 py-2 font-semibold text-white">
          Đăng nhập
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: MISSING SETUP — tạo tài khoản owner**

Thủ công (báo user): Supabase Dashboard → Authentication → Users → Add user (email + password). Đây là tài khoản duy nhất.

- [ ] **Step 5: Kiểm thử middleware redirect**

Run:
```bash
docker compose up -d && sleep 8
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/
```
Expected: `307` redirect tới `/login` (chưa đăng nhập → bị chặn). Sau đó `docker compose down`.

- [ ] **Step 6: Ghi CHANGELOG + commit**

```bash
git add -A
git commit -m "feat: owner login + route isolation middleware"
```

---

## Task 8: Dashboard rỗng + viewer stub

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/v/[token]/page.tsx`

- [ ] **Step 1: Thay `src/app/page.tsx` bằng dashboard rỗng (đã đăng nhập)**

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("project").select("id,name").order("created_at");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold text-navy">Dự án</h1>
      {(!projects || projects.length === 0) ? (
        <p className="mt-6 text-muted">Chưa có dự án nào. (CRUD sẽ thêm ở Plan 2.)</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="rounded-lg border border-line bg-white px-4 py-3">{p.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Tạo viewer stub `src/app/v/[token]/page.tsx`** (token lạ → 404)

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("share_link")
    .select("id, revoked, expires_at, page_id")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.revoked || (link.expires_at && new Date(link.expires_at) < new Date())) {
    notFound();
  }

  // Plan 7 sẽ render đúng template trang theo page_id. Tạm hiển thị placeholder.
  return (
    <main className="mx-auto max-w-3xl p-8">
      <p className="text-muted">Trang chia sẻ hợp lệ (render thực ở Plan 7).</p>
    </main>
  );
}
```

- [ ] **Step 3: Kiểm thử viewer 404 với token lạ**

Run:
```bash
docker compose up -d && sleep 8
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/v/khong-ton-tai
```
Expected: `404`. Sau đó `docker compose down`.

- [ ] **Step 4: Kiểm thử toàn bộ test pass + build OK**

Run: `docker compose run --rm web npm test && docker compose run --rm web npm run build`
Expected: tất cả test PASS, build thành công.

- [ ] **Step 5: Ghi CHANGELOG + commit**

```bash
git add -A
git commit -m "feat: empty dashboard + public viewer stub (404 for unknown token)"
```

---

## Kết quả cuối Plan 1 — cách verify

1. **Setup cần có trước khi test:** `.env.local` đã điền 4 khóa Supabase; đã tạo 1 user owner trong Supabase Auth; đã chạy `npm run migrate`.
2. **Verify từng điểm:**
   - `docker compose up` → `http://localhost:3000/` (chưa login) **redirect về `/login`** (đúng = cô lập hoạt động).
   - Đăng nhập bằng tài khoản owner tại `/login` → vào được `/` thấy "Chưa có dự án nào."
   - `http://localhost:3000/v/abc` (token lạ) → trang **404**.
   - `docker compose run --rm web npm test` → tất cả test PASS.
   - `docker compose run --rm web npm run build` → build thành công.
3. **Trạng thái hệ thống sau Plan 1:** app chạy trong Docker, DB có đủ schema, owner đăng nhập được, route được bảo vệ, viewer có khung. Sẵn sàng cho Plan 2 (Projects & Features).

## Self-Review (đã rà)

- **Spec coverage:** Plan 1 phủ mục 4 (schema — tất cả bảng), mục 5 (route skeleton: `/login`, `/`, `/v/[token]`), mục 6 (cô lập: middleware + admin client server-only), mục 8 (Docker). Các mục 7/9 (share đầy đủ, template render) thuộc Plan 3–7 theo roadmap.
- **Placeholder scan:** không có TODO mơ hồ; mọi step có code/command thật. Hai chỗ "MISSING SETUP" là thao tác thủ công ngoài code (tạo Supabase project, tạo user) — đã nêu rõ.
- **Type consistency:** tên hàm nhất quán (`createClient`, `createAdminClient`, `hashPassword`/`verifyPassword`, `generateToken`); tên bảng/cột khớp giữa migration và code (`project`, `share_link.token`, `page_id`).
