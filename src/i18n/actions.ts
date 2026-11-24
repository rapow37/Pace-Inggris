"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

export async function setLocale(formData: FormData) {
  const raw = formData.get("locale");
  const locale = isLocale(raw) ? raw : defaultLocale;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/");
}
