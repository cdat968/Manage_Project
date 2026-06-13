import { createClient } from "@/lib/supabase/server";

export async function listProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project")
    .select("id,name,slug,client,status,created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project")
    .select("id,name,slug,client,description,status,created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getPages(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page")
    .select("id,kind,title,published")
    .eq("project_id", projectId);
  return data ?? [];
}

export async function getFeatures(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature")
    .select("id,name,description,status,order")
    .eq("project_id", projectId)
    .order("order", { ascending: true });
  return data ?? [];
}
