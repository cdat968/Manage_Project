"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/domain/slug";
import { buildDefaultPages } from "@/lib/domain/pages";
import { generateToken } from "@/lib/share/token";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  if (!name) return;

  const supabase = await createClient();
  const base = slugify(name) || "project";

  // chèn project, nếu trùng slug thì thêm hậu tố ngắn
  let slug = base;
  let projectId: string | null = null;
  for (let attempt = 0; attempt < 3 && !projectId; attempt++) {
    const { data, error } = await supabase
      .from("project")
      .insert({ name, client, slug })
      .select("id")
      .single();
    if (!error && data) {
      projectId = data.id;
    } else {
      slug = `${base}-${generateToken().slice(0, 4).toLowerCase()}`;
    }
  }
  if (!projectId) return;

  await supabase.from("page").insert(buildDefaultPages(projectId));
  revalidatePath("/");
  redirect(`/projects/${projectId}`);
}

export async function updateProject(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase.from("project").update({ name, client, description }).eq("id", id);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("project").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}
