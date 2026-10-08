import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  email,
  src,
  size = 32,
  className,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? "avatar"}
        style={dim}
        className={cn("rounded-full object-cover ring-1 ring-border", className)}
      />
    );
  }
  return (
    <span
      style={{ ...dim, fontSize: size * 0.4 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-soft font-semibold text-brand ring-1 ring-border",
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}
