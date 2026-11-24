import { IntlMessageFormat } from "intl-messageformat";
import { cookies, headers } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { messages, type MessageKey } from "./messages";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) {
    return fromCookie;
  }

  const headerList = await headers();
  const first = (headerList.get("accept-language") ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("en")) {
    return "en";
  }

  return defaultLocale;
}

export type Translator = (key: MessageKey, values?: Record<string, string | number>) => string;

export async function getTranslator(): Promise<Translator> {
  const locale = await getLocale();
  const table = messages[locale];
  const cache = new Map<MessageKey, IntlMessageFormat>();

  return (key, values) => {
    let formatter = cache.get(key);
    if (!formatter) {
      formatter = new IntlMessageFormat(table[key], locale);
      cache.set(key, formatter);
    }
    return String(formatter.format(values));
  };
}
