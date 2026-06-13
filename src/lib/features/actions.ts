"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["planned", "in_progress", "done", "blocked"] as const;
type Status = (typeof STATUSES)[number];

function normStatus(v: FormDataEntryValue | null): Status {
  const s = String(v ?? "planned");
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : "planned";
}

export async function createFeature(formData: FormData) {
  const projectId = String(formData.get("project_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) return;
  const supabase = await createClient();
  await supabase.from("feature").insert({
    project_id: projectId,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    status: normStatus(formData.get("status")),
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function updateFeature(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("feature")
    .update({
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      status: normStatus(formData.get("status")),
    })
    .eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteFeature(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("feature").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
