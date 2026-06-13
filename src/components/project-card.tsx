import Link from "next/link";

type Project = {
  id: string;
  name: string;
  client: string | null;
  status: string | null;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative block overflow-hidden rounded-xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gold opacity-70 transition group-hover:opacity-100" />
      <h3 className="font-semibold text-navy group-hover:text-navy-deep">{project.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{project.client || "—"}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal">
        <span className="size-1.5 rounded-full bg-teal" />
        {project.status ?? "active"}
      </span>
    </Link>
  );
}
