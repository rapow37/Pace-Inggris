"use client";

import { setLocale } from "@/i18n/actions";
import { useLocale, useMessages } from "@/i18n/client";
import { ThemeToggle } from "./theme-toggle";

export function HeaderControls() {
  const t = useMessages();
  const locale = useLocale();
  const next = locale === "id" ? "en" : "id";

  return (
    <div className="flex items-center gap-2">
      <form action={setLocale}>
        <input type="hidden" name="locale" value={next} />
        <button
          type="submit"
          aria-label={t["locale.label"]}
          className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t["locale.switch"]}
        </button>
      </form>
      <ThemeToggle
        labels={{
          toggleDark: t["theme.toggleDark"],
          toggleLight: t["theme.toggleLight"],
          labelDark: t["theme.labelDark"],
          labelLight: t["theme.labelLight"],
        }}
      />
    </div>
  );
}
