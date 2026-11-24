"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Labels = {
  delete: string;
  confirm: string;
  yes: string;
  cancel: string;
  error: string;
};

export function DeleteAccount({ labels }: { labels: Labels }) {
  const [step, setStep] = useState<"idle" | "confirm" | "working" | "error">("idle");

  async function doDelete() {
    setStep("working");
    try {
      const res = await fetch("/api/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        setStep("error");
        return;
      }
      await signOut({ redirectTo: "/" });
    } catch {
      setStep("error");
    }
  }

  if (step === "idle") {
    return (
      <Button type="button" variant="outline" onClick={() => setStep("confirm")}>
        {labels.delete}
      </Button>
    );
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-danger p-4"
      role="alertdialog"
      aria-live="polite"
    >
      <p className="text-sm text-fg">{labels.confirm}</p>
      {step === "error" ? <p className="text-sm text-danger">{labels.error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={doDelete}
          disabled={step === "working"}
          className="bg-danger text-white"
        >
          {labels.yes}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setStep("idle")}>
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
