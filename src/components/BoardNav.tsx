"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Map, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function BoardNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/b/${slug}`;
  const tabs = [
    { href: base, label: "Feedback", icon: MessageSquare, match: (p: string) => p === base || p.startsWith(`${base}/p/`) },
    { href: `${base}/roadmap`, label: "Roadmap", icon: Map, match: (p: string) => p === `${base}/roadmap` },
    { href: `${base}/changelog`, label: "Changelog", icon: Megaphone, match: (p: string) => p === `${base}/changelog` },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "border-brand text-fg"
                : "border-transparent text-muted hover:border-border hover:text-fg",
            )}
          >
            <t.icon size={16} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
