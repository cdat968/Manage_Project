# Project Management & Reporting Hub

Web app quản lý report theo project + chia sẻ link bí mật. Dev chạy hoàn toàn trong Docker.

## Chạy
1. Copy `.env.example` → `.env.local`, điền khóa Supabase (dùng Session pooler port 5432 cho `DATABASE_URL`).
2. `docker compose run --rm web npm install` (lần đầu, hoặc `docker compose build`).
3. `docker compose run --rm web npm run migrate` (tạo schema DB).
4. Tạo 1 user owner: Supabase → Authentication → Users → Add user (Auto Confirm).
5. `docker compose up` → mở http://localhost:3000.

## Test
`docker compose run --rm web npm test`

## Tài liệu
- Spec: `docs/superpowers/specs/2026-06-13-project-mgmt-hub-design.md`
- Kế hoạch: `docs/superpowers/plans/`
