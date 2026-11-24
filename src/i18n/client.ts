"use client";

import { useSyncExternalStore } from "react";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { messages } from "./messages";

function getSnapshot(): Locale {
  const match = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`).exec(document.cookie);
  const value = match?.[1];
  return isLocale(value) ? value : defaultLocale;
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

function subscribe(callback: () => void) {
  window.addEventListener("focus", callback);
  return () => window.removeEventListener("focus", callback);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMessages() {
  return messages[useLocale()];
}
