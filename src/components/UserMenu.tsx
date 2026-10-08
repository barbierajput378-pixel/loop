import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export async function UserMenu({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
        <Button size="sm" variant="primary">
          Sign in
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="hidden text-sm font-medium text-muted hover:text-fg sm:block"
        >
          Dashboard
        </Link>
      )}
      <Avatar
        name={session.user.name}
        email={session.user.email}
        src={session.user.image}
        size={32}
      />
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button size="sm" variant="ghost" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
