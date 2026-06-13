import { createClient } from "@/lib/supabase/server";
import type { PageKind } from "@/lib/domain/pages";

export async function getPage(projectId: string, kind: PageKind) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page")
    .select("id,kind,title,published,html_vi,html_en,project_id")
    .eq("project_id", projectId)
    .eq("kind", kind)
    .maybeSingle();
  return data;
}
