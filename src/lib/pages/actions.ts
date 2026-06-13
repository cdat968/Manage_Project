"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePage(formData: FormData) {
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  const slug = String(formData.get("slug")); // "report" | "guide" để revalidate
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("page")
    .update({
      title: String(formData.get("title") ?? "").trim() || "Untitled",
      html_vi: String(formData.get("html_vi") ?? ""),
      html_en: String(formData.get("html_en") ?? "") || null,
      published: formData.get("published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/projects/${projectId}/${slug}`);
}
