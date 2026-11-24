import { Suspense } from "react";

import { ReviewRunner } from "@/components/lesson/review-runner";

export const instant = false;

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-muted-fg">…</p>}>
      <ReviewRunner />
    </Suspense>
  );
}
