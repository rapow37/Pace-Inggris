"use client";

import { useSyncExternalStore } from "react";

type Labels = {
  toggleDark: string;
  toggleLight: string;
  labelDark: string;
  labelLight: string;
};

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ labels }: { labels: Labels }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore storage failures (private mode)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? labels.toggleLight : labels.toggleDark}
      className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-fg/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {isDark ? labels.labelLight : labels.labelDark}
    </button>
  );
}
