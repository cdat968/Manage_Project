# Project Management & Reporting Hub — Design

**Date:** 2026-06-13 · **Revised:** 2026-06-14
**Status:** Approved (design phase) — Revision 2 (mô hình template + inline edit)
**Author:** aidev3@technext.asia

## Revision 2 (2026-06-14) — Tóm tắt thay đổi lớn

Thay đổi mô hình nội dung sau khi làm rõ requirement:

1. **Mọi trang đều SỬA ĐƯỢC trong app + lưu thành TEMPLATE tái dùng** cho project khác (trước đây chỉ một số trang sửa được).
2. **Phân lại 2 họ trang:**
   - **Họ "tài liệu" (free-form HTML):** chỉ **Report cho sếp**. Soạn HTML (VI/EN), render iframe → **bản in cuối cùng**. Lưu cả HTML thành *document template*.
   - **Họ "có cấu trúc" (template-slot + dữ liệu + inline edit):** **Hướng dẫn, Test Cases, Bug Tickets, Nhật ký**. Render bằng React từ **dữ liệu record**, đặt trong **template/theme** giữ nguyên định dạng; **sửa inline tại chỗ (optimistic, 1 người)**, có nút **thêm/xoá record**.
3. **Hướng "sinh trang tương tác" = Hướng ① (template có slot + data cấu trúc)**, KHÔNG parse HTML tùy ý, KHÔNG dùng LLM. Template = "bộ khung/định dạng" có vùng slot; record = dữ liệu đổ vào slot.
4. **Thư viện template** (mới): lưu & chọn lại template cho từng trang ở project khác.
5. **Realtime = optimistic inline (1 owner)** — sửa thấy ngay, lưu ngầm; KHÔNG cần live-sync nhiều thiết bị (giai đoạn này).

**Ảnh hưởng tới plan đã làm:** Plan 3 (đang ở nhánh `feat/free-form-pages`) đã dựng editor free-form cho **cả Report và Hướng dẫn**. Theo revision này: **giữ phần Report**; **Hướng dẫn chuyển sang họ có-cấu-trúc** (sẽ làm lại trong plan structured). Plan 4/5/6 viết theo mô hình template-slot + inline edit.

**Điểm còn để ngỏ (cần xác nhận khi review):** Hướng dẫn có cần song ngữ VI/EN không? Revision này mặc định **structured pages chỉ VI** ở v1 (Report vẫn song ngữ). Nếu cần Hướng dẫn song ngữ → mỗi block có thêm trường EN.

## 1. Mục tiêu

Một web app tập trung để quản lý nhiều **dự án (project)**. Mỗi project gồm 5 loại trang report và một danh sách **tính năng (feature)**. Owner (chỉ một người — bạn) quản lý mọi thứ; người khác chỉ xem được **đúng trang** qua link bí mật được gửi, không thấy bất kỳ phần nào khác của hệ thống.

Hiện trạng cần thay thế: các report đang là **file HTML thủ công, rời rạc** (single-file, có mermaid, song ngữ, branding TechNext). Hệ thống mới đưa chúng về một nơi quản lý tập trung + chia sẻ có kiểm soát.

## 2. Phạm vi — 5 loại trang / project

| # | Trang | Họ | Mô hình | Sửa | Template | File mẫu |
|---|-------|-----|---------|-----|----------|----------|
| 1 | **Report cho sếp** | Tài liệu | HTML tự do (VI/EN), iframe — bản in cuối | Editor HTML | Document template (lưu HTML) | `HRM_ODOO_REPORT_VI.html` |
| 2 | **Hướng dẫn sử dụng** | Có cấu trúc | Block (title+body+ảnh+nhãn hệ thống) | Inline | Theme template | `Huong-dan-HR.html` |
| 3 | **Test Cases** | Có cấu trúc | Record TC (schema cố định) | Inline + thêm/xoá record | Theme template | `Test-Cases-Cham-cong.html` |
| 4 | **Bug Tickets** | Có cấu trúc | Record bug (schema cố định) | Inline + thêm/xoá record | Theme template | `bug_report_landingPage.html` |
| 5 | **Nhật ký triển khai** | Có cấu trúc | Entry gom theo feature | Inline + thêm/xoá record | Theme template | *(mới)* |

- **Inline edit**: bấm thẳng vào field/section trên trang đã render để sửa tại chỗ; lưu **optimistic** (UI đổi ngay, ghi DB ngầm). Có nút **+ Thêm record/block**; record cũ giữ nguyên; định dạng giữ nguyên (mọi record vẽ bằng cùng "khuôn" của template).
- Style chuẩn: theo `restaurant-workflow-bilingual.html` — font Inter, palette navy/teal/gold, card bo góc, mermaid, branding TechNext.

## 3. Quyết định chốt

- **Kiến trúc (Phương án 1):** một app Next.js (App Router) fullstack + Supabase (Postgres + Storage + Auth). Toàn bộ app nằm sau đăng nhập, **riêng** nhóm route `/v/[token]` công khai.
- **Nội dung (2 họ):** *Tài liệu* = Report cho sếp (HTML tự do, iframe). *Có cấu trúc* = Hướng dẫn + Test Cases + Bug + Nhật ký (dữ liệu record render bằng React trong template/theme).
- **Sửa inline + optimistic (1 owner):** trang có-cấu-trúc cho sửa tại chỗ; thêm/xoá record; lưu ngầm. KHÔNG live-sync nhiều thiết bị ở giai đoạn này.
- **Sinh trang tương tác = Hướng ① (template-slot + data):** template = bộ khung/định dạng có vùng slot; record = dữ liệu đổ vào. KHÔNG parse HTML tùy ý (Hướng ②), KHÔNG dùng LLM.
- **Thư viện template:** mọi trang lưu được nội dung/định dạng hiện tại thành template (đặt tên) → chọn lại cho trang cùng loại ở project khác.
- **Chia sẻ (link bí mật, không đăng nhập):** mỗi trang sinh token ngẫu nhiên; tùy chọn mật khẩu / hết hạn / thu hồi. Ai có link là xem được đúng trang đó.
- **Vai trò = nhãn phân loại người nhận** (colleague/manager/boss), **không** thay đổi quyền. Chỉ owner có tài khoản đăng nhập.
- **Song ngữ:** Report cho sếp = song ngữ VI/EN (HTML). Trang có-cấu-trúc = **chỉ VI ở v1** (Hướng dẫn song ngữ = để ngỏ). **Mặc định hiển thị tiếng Việt.**
- **Test Cases & Bug = bảng sống:** trạng thái cập nhật được + thống kê + lọc; sửa inline.
- **Nhật ký = hybrid:** chủ yếu nhập tay, có thể tham chiếu commit; **gom theo từng feature**.
- **Dev environment:** chạy hoàn toàn trong Docker; Node/Next.js/deps trong container, **không cài lên máy**. Supabase = cloud free-tier.

## 4. Mô hình dữ liệu (Supabase / Postgres)

Khái niệm trung tâm: `project` → 5 dòng `page` (1/kind) + nhiều `feature`. TC/Bug/Nhật ký đều gắn được vào `feature`.

```
auth.users            -- chỉ 1 owner, Supabase Auth
project               id, name, slug, client, description, status, cover_url, created_at
feature               id, project_id, name, description,
                      status(planned|in_progress|done|blocked), order
page                  id, project_id, kind, title, published, updated_at,
                      html_vi, html_en,             -- chỉ dùng cho họ tài liệu (exec_report)
                      template_id?                  -- template/theme đang áp dụng (FK -> template)
                      kind ∈ {exec_report, user_guide, test_cases, bugs, changelog}
                      -- mỗi project có đúng 5 dòng page (1/kind)
template              id, name, target_kind,        -- template tái dùng cho 1 loại trang
                      type(document|theme),         -- document: lưu html; theme: lưu config
                      html?,                         -- với type=document (Report)
                      config(jsonb)?,                -- với type=theme (màu/layout/cột hiển thị)
                      created_at
guide_block           id, project_id, "order",      -- 1 block của trang Hướng dẫn
                      title, body, system_label,    -- nhãn hệ thống (vd "Odoo · Employees")
                      images(jsonb: mảng path)
test_case             id, project_id, feature_id?, section, code(TC-xx),
                      type(Positive|Boundary|Business|Negative),
                      summary, precondition, steps(jsonb), expected,
                      result(pass|fail|not_run), note, order
bug                   id, project_id, feature_id?, code(BUG-x), summary,
                      description, expected, observed,
                      severity(S1..S4), priority(P1..P4),
                      status(New|InProgress|Fixed|WontFix),
                      suggested_fix, steps(jsonb: mỗi step có mảng ảnh),
                      fixed_at, order
changelog_entry       id, project_id, feature_id, date, title,
                      status, body(markdown), commit_refs(text[]), order
share_link            id, page_id, token(unique), label(colleague|manager|boss),
                      recipient_note, password_hash?, expires_at?, revoked,
                      view_count, last_viewed_at, created_at
```

- **Ảnh:** Supabase Storage bucket `evidence`, path `projectId/kind/entityId/...`. DB chỉ lưu **path**; viewer công khai nhận **signed URL** sinh ở server.
- **Bilingual:** chỉ `page.html_vi` + `page.html_en` cho `exec_report` (Report). Trang có-cấu-trúc chỉ VI ở v1.
- **Template tái dùng:** "Lưu thành template" → tạo dòng `template` (document=html của Report; theme=config cho trang có-cấu-trúc). "Áp template" → set `page.template_id` (+ copy html nếu là document).
- **Inline edit:** mỗi field/record sửa tại chỗ qua server action nhỏ + optimistic UI (React `useOptimistic`); thêm record = insert 1 dòng (test_case/bug/guide_block/changelog_entry); record cũ không đổi.
- **RLS:** mọi bảng khóa cho owner. Viewer công khai không đọc trực tiếp DB (đọc qua server — mục 6).

## 5. Cấu trúc route

**Khu vực quản trị (bắt buộc đăng nhập — chỉ owner):**
```
/login
/                              dashboard: danh sách project
/projects/[id]                 tổng quan: 5 tab page + danh sách feature
/projects/[id]/report          editor HTML (VI/EN) + preview + lưu/chọn template
/projects/[id]/guide           các block hướng dẫn, sửa inline + thêm/xoá
/projects/[id]/test-cases      bảng sống: lọc, đếm pass/fail, sửa inline + thêm TC
/projects/[id]/bugs            bảng → modal chi tiết → gallery evidence, sửa inline
/projects/[id]/changelog       timeline theo feature, sửa inline + thêm entry
/projects/[id]/templates       thư viện template (lưu/chọn cho từng loại trang)
/projects/[id]/shares          tạo/thu hồi link, đặt mật khẩu/hạn
```

**Khu vực công khai (KHÔNG đăng nhập):**
```
/v/[token]                     render read-only đúng 1 trang của token
```

## 6. Cô lập bảo mật (yêu cầu cốt lõi)

1. **Middleware Next.js:** mọi đường dẫn trừ `/v/*`, `/login`, asset tĩnh → không có session ⇒ redirect `/login`. Người ngoài không vào được dashboard/project.
2. **`/v/[token]` chạy server-side:** tra `share_link` theo token → kiểm `revoked` / `expires_at` / `password` → chỉ trả dữ liệu của đúng `page` đó. **Service-role key chỉ ở server**, không xuống client. Token sai/hết hạn ⇒ 404 chung chung.
3. Trang viewer **không có** nav/menu/link sang trang khác — đúng nghĩa "ngõ cụt 1 trang".
4. Ảnh trong viewer = **signed URL hết hạn ngắn**, sinh khi render.

## 7. Cơ chế Share

Tạo link tại `/projects/[id]/shares`: chọn 1 trong 5 trang → sinh `token` (nanoid) → link `/v/<token>`.

| Tùy chọn | Ý nghĩa |
|---|---|
| Nhãn người nhận | colleague / manager / boss — chỉ để theo dõi |
| Ghi chú | vd "gửi sếp A review tháng 6" |
| Mật khẩu (tùy chọn) | nhập đúng mới xem; lưu `bcrypt hash` |
| Hết hạn (tùy chọn) | quá hạn ⇒ 404 |
| Thu hồi | `revoked=true`, tắt link tức thì |

- Theo dõi: mỗi lượt mở tăng `view_count`, ghi `last_viewed_at`.
- 1 trang có thể tạo nhiều link (mỗi người nhận 1 link riêng) → thu hồi/đặt hạn độc lập.

## 8. Setup Docker

Máy chỉ cần Docker Desktop. Node/Next.js/deps trong container.

```yaml
# docker-compose.yml
services:
  web:
    build: .                    # Dockerfile: node:22-alpine
    ports: ["3000:3000"]
    volumes:
      - ./:/app                       # bind mount source (hot reload)
      - node_modules:/app/node_modules # named volume → deps không đổ ra máy
    env_file: .env.local              # khóa Supabase
    command: npm run dev
volumes:
  node_modules:
```

- Supabase = cloud free-tier (URL + anon key + service-role key trong `.env.local`).
- `npm install` chạy trong container: `docker compose run web npm install`.
- Tùy chọn sau: Supabase local (`supabase start`) để offline hoàn toàn — nặng, hoãn.
- **Production / deploy** (gửi link ra ngoài): quyết ở bước triển khai (deploy container hoặc Vercel + Supabase). Chưa quyết.

## 9. Template & render từng trang

Design system dùng chung (Inter, navy/teal/gold, card, branding TechNext) tách thành theme React + CSS.

**Mô hình chung cho họ có-cấu-trúc (Hướng ①):**
- **Template/theme** = bộ khung tĩnh (header, tiêu đề cột, màu, "khuôn 1 record") + vùng **slot** "danh sách record nằm ở đây".
- **Render**: lấy record từ DB → vẽ mỗi record bằng khuôn của template trong slot.
- **Inline edit**: bấm field → sửa tại chỗ (optimistic) → server action lưu. Nút **+ Thêm record** (record cũ giữ nguyên). Định dạng nhất quán vì mọi record dùng chung khuôn.
- **Lưu template**: lưu config theme hiện tại thành `template` để chọn lại cho project khác.

| Trang | Render | Đặc điểm |
|---|---|---|
| Report cho sếp | HTML self-contained trong **iframe sandbox** | Họ tài liệu: editor HTML + preview, mermaid + toggle VI/EN, lưu HTML thành document template |
| Hướng dẫn | React từ `guide_block` trong theme | Inline: thêm/sửa/xoá block (title+body+ảnh+nhãn hệ thống), kéo thả thứ tự |
| Test Cases | React từ `test_case` trong theme | Header thống kê (`42/50 pass · 3 fail`), chip type, badge Pass/Fail; sửa inline; lọc; thumbnail → lightbox; + Thêm TC |
| Bug Tickets | React từ `bug` trong theme | Bảng → modal chi tiết (S1–S4, P1–P4, expected/observed, suggested fix) → Step Evidence gallery; sửa inline; + Thêm bug |
| Nhật ký | React từ `changelog_entry` trong theme | Timeline gom theo Feature; chip trạng thái, ảnh, link commit; sửa inline; + Thêm entry |

Trang `/v/[token]` = đúng template tương ứng nhưng **read-only**, không nav, không sửa, không nút thêm.

## 10. Ngoài phạm vi (giai đoạn này)

- Phân quyền nhiều cấp cho người xem (mọi người xem đều ẩn danh qua token).
- Auto-sync nhật ký từ git (chỉ tham chiếu commit thủ công).
- Supabase local / offline.
- Quyết định hạ tầng production.
- **Live-sync nhiều thiết bị/đa người** (chỉ optimistic inline 1 owner).
- **Song ngữ cho trang có-cấu-trúc** (chỉ Report song ngữ; Hướng dẫn/TC/Bug/Nhật ký = VI ở v1).
- **Parse HTML tùy ý → block (Hướng ②)** và chuyển đổi bằng LLM (Hướng ③).
