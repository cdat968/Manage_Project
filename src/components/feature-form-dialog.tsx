"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFeature, updateFeature } from "@/lib/features/actions";

type Feature = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "planned", label: "Dự kiến" },
  { value: "in_progress", label: "Đang làm" },
  { value: "done", label: "Xong" },
  { value: "blocked", label: "Vướng" },
];

export function FeatureFormDialog({
  projectId,
  feature,
  trigger,
}: {
  projectId: string;
  feature?: Feature;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(feature);
  const action = editing ? updateFeature : createFeature;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa tính năng" : "Thêm tính năng"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          {feature && <input type="hidden" name="id" value={feature.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên tính năng</Label>
            <Input id="name" name="name" required defaultValue={feature?.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              name="description"
              defaultValue={feature?.description ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Trạng thái</Label>
            <select
              id="status"
              name="status"
              defaultValue={feature?.status ?? "planned"}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Lưu
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
