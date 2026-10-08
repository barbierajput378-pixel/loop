import type { PostStatus, PostType, Priority } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { STATUS_META, TYPE_META, PRIORITY_META } from "@/lib/labels";

export function StatusBadge({ status }: { status: PostStatus }) {
  const m = STATUS_META[status];
  return (
    <Badge className={m.color} dot={m.dot}>
      {m.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: PostType }) {
  const m = TYPE_META[type];
  return <Badge className={m.color}>{m.emoji} {m.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return <Badge className={m.color}>{m.label}</Badge>;
}
