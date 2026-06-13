import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("share_link")
    .select("id, revoked, expires_at, page_id")
    .eq("token", token)
    .maybeSingle();

  if (
    !link ||
    link.revoked ||
    (link.expires_at && new Date(link.expires_at) < new Date())
  ) {
    notFound();
  }

  // Plan 7 sẽ render đúng template trang theo page_id. Tạm hiển thị placeholder.
  return (
    <main className="mx-auto max-w-3xl p-8">
      <p className="text-muted-foreground">
        Trang chia sẻ hợp lệ (render thực ở Plan 7).
      </p>
    </main>
  );
}
