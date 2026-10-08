"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ALL_STATUSES, STATUS_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "top", label: "Top" },
  { value: "trending", label: "Trending" },
  { value: "new", label: "Newest" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((params.get("search") ?? "") !== search) {
        setParam("search", search || null);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, params, setParam]);

  const sort = params.get("sort") ?? "top";
  const status = params.get("status");

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback…"
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <SlidersHorizontal size={15} className="ml-1.5 text-muted" />
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setParam("sort", s.value === "top" ? null : s.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                sort === s.value ? "bg-brand text-brand-fg" : "text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setParam("status", null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !status ? "border-brand bg-brand-soft text-brand" : "border-border text-muted hover:text-fg",
          )}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setParam("status", s === status ? null : s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              status === s ? "border-brand bg-brand-soft text-brand" : "border-border text-muted hover:text-fg",
            )}
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}
