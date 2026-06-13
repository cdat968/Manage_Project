# Changelog

Mọi thay đổi đáng kể của dự án được ghi tại đây. Định dạng theo Keep a Changelog.

## [Unreleased]
## [Plan 2 — Projects & Features]

### Added
- slugify + page-kinds/buildDefaultPages domain helpers (TDD).
- Project CRUD: dashboard list, tạo project (tự sinh 5 trang), sửa/xoá (cascade).
- Feature CRUD: thêm/sửa/xoá + trạng thái (badge màu) trong trang tổng quan project.
- Trang `/projects/[id]`: thông tin + 5 tab trang (link sang trang con Plan 3–7) + danh sách feature.
- shadcn/ui (Base UI) components: card/dialog/input/label/select/dropdown-menu/badge/sonner.

### Changed
- Dùng font `geist` self-hosted thay `next/font/google` (tránh lỗi fetch mạng khi build trong Docker).


### Added
- Khởi tạo dự án: CLAUDE.md, CHANGELOG.md, .gitignore, .env.example (Plan 1 / Task 0).
- Scaffold Next.js 16 + React 19 + Tailwind v4, chạy trong Docker (Dockerfile, docker-compose). Deps trong named volume, không cài lên máy (Plan 1 / Task 1).
- Cấu hình Vitest + Testing Library (TDD infra) (Plan 1 / Task 2).
- Init shadcn/ui + brand design tokens navy/teal/gold (Plan 1 / Task 3).
- Schema DB đầy đủ (8 bảng + 8 enum + RLS) + migration runner qua `pg` (Plan 1 / Task 5).
- Supabase clients browser/server/admin (Plan 1 / Task 6).
- Đăng nhập owner (email/password) + `proxy.ts` (Next 16 middleware) cô lập route: chặn mọi route trừ /login, /v/* (Plan 1 / Task 7).
- Dashboard rỗng + viewer stub `/v/[token]` (404 cho token lạ) (Plan 1 / Task 8).
- Đưa `.next` vào named volume (tránh stale cache lẫn giữa máy & container).
