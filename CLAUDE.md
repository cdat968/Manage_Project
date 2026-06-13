# CLAUDE.md — Project Management & Reporting Hub

## Dự án
Web app quản lý nhiều project; mỗi project có 5 trang (Report cho sếp, Hướng dẫn,
Test Cases, Bug Tickets, Nhật ký). Owner quản lý tất cả; người ngoài chỉ xem được
đúng 1 trang qua link bí mật `/v/[token]`. Spec: `docs/superpowers/specs/2026-06-13-project-mgmt-hub-design.md`.
Kế hoạch: `docs/superpowers/plans/`.

## Quy tắc môi trường (BẮT BUỘC)
- Dev chạy HOÀN TOÀN trong Docker. KHÔNG cài/chạy npm trực tiếp trên máy.
- Khởi động: `docker compose up`. Lệnh một lần: `docker compose run --rm web <cmd>`.
- Test: `docker compose run --rm web npm test`.

## Quy tắc code
- TypeScript strict. Next.js App Router. Tailwind v4 (tokens trong globals.css).
- Khu admin dùng shadcn/ui; trang report/viewer dùng design system tùy biến (navy/teal/gold).
- TDD cho mọi logic thuần (lib/**). Frequent commits, message rõ ràng.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) CHỈ dùng ở server (`lib/supabase/admin.ts`),
  TUYỆT ĐỐI không import vào client component.

## Tracking
- Mỗi thay đổi đáng kể PHẢI ghi 1 dòng vào `CHANGELOG.md` (mục [Unreleased]).

## Bảo mật cô lập
- `middleware.ts` chặn mọi route trừ `/login`, `/v/*`, asset tĩnh.
- Trang `/v/[token]` chỉ đọc DB qua server bằng admin client, trả đúng 1 page.
