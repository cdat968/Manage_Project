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
import { createProject } from "@/lib/projects/actions";

export function ProjectCreateDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-navy text-white hover:bg-navy-deep" />}>
        + Dự án mới
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo dự án</DialogTitle>
        </DialogHeader>
        <form action={createProject} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên dự án</Label>
            <Input id="name" name="name" required placeholder="VD: Hệ thống Chấm công" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="client">Khách hàng (tuỳ chọn)</Label>
            <Input id="client" name="client" placeholder="VD: TechNext" />
          </div>
          <Button type="submit" className="w-full bg-navy text-white hover:bg-navy-deep">
            Tạo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
