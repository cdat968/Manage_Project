import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("project")
    .select("id,name")
    .order("created_at");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold text-navy">Dự án</h1>
      {!projects || projects.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Chưa có dự án nào. (CRUD sẽ thêm ở Plan 2.)
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-line bg-white px-4 py-3"
            >
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
