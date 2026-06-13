import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProject, getFeatures } from "@/lib/projects/queries";
import { PageTabs } from "@/components/page-tabs";
import { FeatureList } from "@/components/feature-list";
import { ProjectSettings } from "@/components/project-settings";

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const features = await getFeatures(id);

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-navy"
      >
        <ChevronLeft className="size-4" />
        Tất cả dự án
      </Link>

      <div className="mt-3 flex items-start justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">{project.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
              <span className="size-1.5 rounded-full bg-teal" />
              {project.status ?? "active"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{project.client || "—"}</p>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-ink/70">{project.description}</p>
          )}
        </div>
        <ProjectSettings project={project} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal">Trang</h2>
        <PageTabs projectId={id} />
      </section>

      <section className="mt-10">
        <FeatureList projectId={id} features={features} />
      </section>
    </main>
  );
}
