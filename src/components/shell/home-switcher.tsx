"use client";

import { useRouter, usePathname } from "next/navigation";
import type { UserHome } from "@/lib/types/database";

export function HomeSwitcher({ homes, activeId }: { homes: UserHome[]; activeId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const homeId = e.target.value;
    // Keep the current sub-page when possible.
    const rest = pathname.replace(/^\/app\/assistant/, "").replace(/^\/app\/homes\/[^/]+/, "");
    router.push(`/app/assistant?home=${homeId}`);
    router.refresh();
  }

  return (
    <select
      value={activeId}
      onChange={change}
      className="rounded-xl border bg-surface px-3.5 py-2.5 text-sm font-medium text-primary focus:border-accent/50 focus:outline-none"
      aria-label="Select home"
    >
      {homes.map((h) => (
        <option key={h.home_id} value={h.home_id}>
          {h.name}
        </option>
      ))}
    </select>
  );
}
