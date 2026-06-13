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
      className="block rounded-xl border border-line bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <h3 className="font-semibold text-navy">{project.name}</h3>
      {project.client && (
        <p className="mt-1 text-sm text-muted-foreground">{project.client}</p>
      )}
      <span className="mt-3 inline-block rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal">
        {project.status ?? "active"}
      </span>
    </Link>
  );
}
