import { listProjects } from "@/lib/projects/queries";
import { ProjectCard } from "@/components/project-card";
import { ProjectCreateDialog } from "@/components/project-create-dialog";

export default async function Dashboard() {
  const projects = await listProjects();

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-end justify-between border-b border-line pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal">Tổng quan</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy">Dự án</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} dự án · quản lý report, test case, bug, nhật ký
          </p>
        </div>
        <ProjectCreateDialog />
      </div>

      {projects.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 py-20 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-navy/5 text-2xl text-navy">◆</div>
          <h2 className="mt-4 font-semibold text-navy">Chưa có dự án nào</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Tạo dự án đầu tiên để bắt đầu quản lý report và chia sẻ cho sếp.
          </p>
          <div className="mt-5">
            <ProjectCreateDialog />
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}
