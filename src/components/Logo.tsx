import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2 font-semibold", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-fg shadow-subtle">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M12 3a9 9 0 1 0 9 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="4" r="2.5" fill="currentColor" />
        </svg>
      </span>
      <span className="text-lg tracking-tight">Loop</span>
    </Link>
  );
}
