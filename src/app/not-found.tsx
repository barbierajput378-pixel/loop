import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-bold tracking-tight text-brand">404</p>
        <h1 className="mt-3 text-xl font-semibold">This page took a detour</h1>
        <p className="mt-1 text-sm text-muted">
          The board or page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
