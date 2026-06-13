# Project Management & Reporting Hub — Design

**Date:** 2026-06-13
**Status:** Approved (design phase)
**Author:** aidev3@technext.asia

## 1. Mục tiêu

Một web app tập trung để quản lý nhiều **dự án (project)**. Mỗi project gồm 5 loại trang report và một danh sách **tính năng (feature)**. Owner (chỉ một người — bạn) quản lý mọi thứ; người khác chỉ xem được **đúng trang** qua link bí mật được gửi, không thấy bất kỳ phần nào khác của hệ thống.

Hiện trạng cần thay thế: các report đang là **file HTML thủ công, rời rạc** (single-file, có mermaid, song ngữ, branding TechNext). Hệ thống mới đưa chúng về một nơi quản lý tập trung + chia sẻ có kiểm soát.

## 2. Phạm vi — 5 loại trang / project

| # | Trang | Loại nội dung | File mẫu tham chiếu |
|---|-------|---------------|---------------------|
| 1 | **Report cho sếp** | HTML tự do (song ngữ) | `HRM_ODOO_REPORT_VI.html` |
| 2 | **Hướng dẫn sử dụng** | HTML tự do (song ngữ) | `Huong-dan-HR.html` |
| 3 | **Test Cases** | Dữ liệu có cấu trúc — bảng sống | `Test-Cases-Cham-cong.html` |
| 4 | **Bug Tickets** | Dữ liệu có cấu trúc — bảng sống | `bug_report_landingPage.html` |
| 5 | **Nhật ký triển khai** | Dữ liệu có cấu trúc — timeline theo feature | *(mới)* |

Style chuẩn (đẹp, in PDF tốt): theo `restaurant-workflow-bilingual.html` — font Inter, palette navy/teal/gold, card bo góc, mermaid, branding TechNext.

## 3. Quyết định chốt

- **Kiến trúc (Phương án 1):** một app Next.js (App Router) fullstack + Supabase (Postgres + Storage + Auth). Toàn bộ app nằm sau đăng nhập, **riêng** nhóm route `/v/[token]` công khai.
- **Nội dung (hybrid):** Report cho sếp + Hướng dẫn = HTML tự do (render iframe sandbox). Test Cases + Bug + Nhật ký = dữ liệu có cấu trúc render bằng React.
- **Chia sẻ (link bí mật, không đăng nhập):** mỗi trang sinh token ngẫu nhiên; tùy chọn mật khẩu / hết hạn / thu hồi. Ai có link là xem được đúng trang đó.
- **Vai trò = nhãn phân loại người nhận** (colleague/manager/boss), **không** thay đổi quyền. Chỉ owner có tài khoản đăng nhập.
- **Song ngữ:** chỉ Report cho sếp + Hướng dẫn có VI/EN toggle. TC/Bug/Nhật ký chỉ tiếng Việt. **Mặc định hiển thị tiếng Việt.**
- **Test Cases & Bug = bảng sống:** có trạng thái cập nhật được + thống kê + lọc.
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
                      html_vi, html_en              -- chỉ dùng cho kind tự do
                      kind ∈ {exec_report, user_guide, test_cases, bugs, changelog}
                      -- mỗi project có đúng 5 dòng page (1/kind)
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
- **Bilingual:** chỉ `page.html_vi` + `page.html_en` cho `exec_report`/`user_guide`.
- **RLS:** mọi bảng khóa cho owner. Viewer công khai không đọc trực tiếp DB (đọc qua server — mục 6).

## 5. Cấu trúc route

**Khu vực quản trị (bắt buộc đăng nhập — chỉ owner):**
```
/login
/                              dashboard: danh sách project
/projects/[id]                 tổng quan: 5 tab page + danh sách feature
/projects/[id]/report          editor HTML (VI/EN) + preview
/projects/[id]/guide           editor HTML (VI/EN)
/projects/[id]/test-cases      bảng sống: lọc, đếm pass/fail, sửa
/projects/[id]/bugs            bảng → modal chi tiết → gallery evidence
/projects/[id]/changelog       timeline theo feature
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

## 9. Template từng trang

Design system dùng chung (Inter, navy/teal/gold, card, branding TechNext) tách thành theme React + CSS.

| Trang | Render | Đặc điểm |
|---|---|---|
| Report cho sếp | HTML self-contained trong **iframe sandbox** | Giữ mermaid + toggle VI/EN + script. Editor + preview |
| Hướng dẫn | iframe sandbox HTML | Song ngữ, ảnh nhúng |
| Test Cases | React từ DB | Header thống kê (vd `42/50 pass · 3 fail`), chip type, badge Pass/Fail/Chưa chạy, lọc theo section/type/trạng thái, thumbnail → lightbox |
| Bug Tickets | React từ DB | Bảng → modal chi tiết (severity S1–S4, priority P1–P4, expected/observed, suggested fix) → **Step Evidence gallery** + lightbox |
| Nhật ký | React từ DB | Timeline gom theo Feature; entry theo ngày, chip trạng thái, ảnh, link commit |

Trang `/v/[token]` = đúng template tương ứng nhưng **read-only**, không nav, không sửa.

## 10. Ngoài phạm vi (giai đoạn này)

- Phân quyền nhiều cấp cho người xem (mọi người xem đều ẩn danh qua token).
- Auto-sync nhật ký từ git (chỉ tham chiếu commit thủ công).
- Supabase local / offline.
- Quyết định hạ tầng production.
