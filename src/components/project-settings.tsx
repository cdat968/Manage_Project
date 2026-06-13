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
import { updateProject, deleteProject } from "@/lib/projects/actions";

type Project = {
  id: string;
  name: string;
  client: string | null;
  description: string | null;
};

export function ProjectSettings({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Cài đặt
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cài đặt dự án</DialogTitle>
        </DialogHeader>
        <form action={updateProject} className="space-y-4">
          <input type="hidden" name="id" value={project.id} />
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên</Label>
            <Input id="name" name="name" required defaultValue={project.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client">Khách hàng</Label>
            <Input id="client" name="client" defaultValue={project.client ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Mô tả</Label>
            <Input
              id="description"
              name="description"
              defaultValue={project.description ?? ""}
            />
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Lưu
          </Button>
        </form>
        <form
          action={deleteProject}
          onSubmit={(e) => {
            if (!confirm("Xoá dự án này và toàn bộ dữ liệu liên quan?")) e.preventDefault();
          }}
          className="border-t border-line pt-4"
        >
          <input type="hidden" name="id" value={project.id} />
          <Button type="submit" variant="ghost" className="w-full text-red-600">
            Xoá dự án
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
