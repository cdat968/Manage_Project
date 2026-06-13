"use client";

import { useState } from "react";
import { availableLanguages, type Lang } from "@/lib/pages/languages";

export function HtmlViewer({
  htmlVi,
  htmlEn,
}: {
  htmlVi: string | null;
  htmlEn: string | null;
}) {
  const langs = availableLanguages({ html_vi: htmlVi, html_en: htmlEn });
  const [lang, setLang] = useState<Lang>("vi");
  const html = (lang === "en" ? htmlEn : htmlVi) || "";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {langs.length > 1 && (
        <div className="flex justify-end gap-1 border-b border-line bg-brand-bg px-3 py-2">
          {langs.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 text-xs font-semibold uppercase transition ${
                lang === l ? "bg-navy text-white" : "text-muted-foreground hover:bg-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {html.trim() ? (
        <iframe
          title="preview"
          sandbox="allow-scripts allow-popups"
          srcDoc={html}
          className="h-[70vh] w-full bg-white"
        />
      ) : (
        <div className="grid h-[40vh] place-items-center text-sm text-muted-foreground">
          Chưa có nội dung. Dán HTML vào editor và lưu.
        </div>
      )}
    </div>
  );
}
