"use client";

import { useRouter } from "next/navigation";

export function reloadPath() {
  const router = useRouter();
  router.refresh();
}
