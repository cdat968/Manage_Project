import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-teal p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-teal/20 blur-3xl" />

      <form
        action={signIn}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-navy text-gold">◆</span>
          <div className="leading-tight">
            <div className="font-bold text-navy">Reporting Hub</div>
            <div className="text-[11px] text-muted-foreground">TechNext</div>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-navy">Đăng nhập</h1>
          <p className="text-sm text-muted-foreground">Khu quản trị — chỉ dành cho owner.</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Mật khẩu"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-navy px-3 py-2.5 font-semibold text-white shadow-sm transition hover:bg-navy-deep"
        >
          Đăng nhập
        </button>
      </form>
    </main>
  );
}
