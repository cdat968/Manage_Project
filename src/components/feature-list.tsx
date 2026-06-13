import { Button } from "@/components/ui/button";
import { FeatureFormDialog } from "@/components/feature-form-dialog";
import { deleteFeature } from "@/lib/features/actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  planned: { label: "Dự kiến", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "Đang làm", cls: "bg-amber-100 text-amber-700" },
  done: { label: "Xong", cls: "bg-emerald-100 text-emerald-700" },
  blocked: { label: "Vướng", cls: "bg-red-100 text-red-700" },
};

export function FeatureList({
  projectId,
  features,
}: {
  projectId: string;
  features: Feature[];
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-teal">
          Tính năng
        </h2>
        <FeatureFormDialog
          projectId={projectId}
          trigger={
            <Button size="sm" variant="outline">
              + Thêm
            </Button>
          }
        />
      </div>
      {features.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có tính năng.</p>
      ) : (
        <ul className="space-y-2">
          {features.map((f) => {
            const b = STATUS_BADGE[f.status] ?? STATUS_BADGE.planned;
            return (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{f.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>
                      {b.label}
                    </span>
                  </div>
                  {f.description && (
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FeatureFormDialog
                    projectId={projectId}
                    feature={f}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Sửa
                      </Button>
                    }
                  />
                  <form action={deleteFeature}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="project_id" value={projectId} />
                    <Button size="sm" variant="ghost" className="text-red-600">
                      Xoá
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
