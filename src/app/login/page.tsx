import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg">
      <form
        action={signIn}
        className="w-80 space-y-4 rounded-2xl border border-line bg-white p-8 shadow"
      >
        <h1 className="text-xl font-bold text-navy">Đăng nhập</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-line px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Mật khẩu"
          className="w-full rounded-lg border border-line px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-navy px-3 py-2 font-semibold text-white"
        >
          Đăng nhập
        </button>
      </form>
    </main>
  );
}
