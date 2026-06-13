import { notFound } from "next/navigation";
import Link from "next/link";
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
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Tất cả dự án
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
          {project.client && (
            <p className="text-sm text-muted-foreground">{project.client}</p>
          )}
        </div>
        <ProjectSettings project={project} />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">
          Trang
        </h2>
        <PageTabs projectId={id} />
      </section>

      <section className="mt-8">
        <FeatureList projectId={id} features={features} />
      </section>
    </main>
  );
}
