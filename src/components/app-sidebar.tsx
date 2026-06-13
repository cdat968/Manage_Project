"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

const NAV = [{ href: "/", label: "Dự án", icon: FolderKanban, match: (p: string) => p === "/" || p.startsWith("/projects") }];

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy-deep text-white/90">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-gold/20 text-gold">◆</span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Reporting Hub</div>
          <div className="text-[11px] text-white/50">TechNext</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white/10 text-white shadow-[inset_3px_0_0_0] shadow-gold"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="truncate px-2 pb-2 text-xs text-white/60">{email}</div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </form>
      </div>
    </aside>
  );
}
