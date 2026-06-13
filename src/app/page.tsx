import { listProjects } from "@/lib/projects/queries";
import { ProjectCard } from "@/components/project-card";
import { ProjectCreateDialog } from "@/components/project-create-dialog";

export default async function Dashboard() {
  const projects = await listProjects();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Dự án</h1>
        <ProjectCreateDialog />
      </div>
      {projects.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Chưa có dự án nào. Bấm “Dự án mới”.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </main>
  );
}
