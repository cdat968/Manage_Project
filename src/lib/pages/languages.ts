export type Lang = "vi" | "en";

export function availableLanguages(page: {
  html_vi: string | null;
  html_en: string | null;
}): Lang[] {
  const langs: Lang[] = ["vi"];
  if (page.html_en && page.html_en.trim().length > 0) langs.push("en");
  return langs;
}
