import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ user }: { user: { firstName: string | null; role: string } | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[#f3efe4]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-tight text-[#145c38]">Sera</span>
          <span className="text-sm text-[#6a4510]" lang="am">
            ሥራ
          </span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
          <Link href="/jobs" className="rounded-md px-2.5 py-1.5 hover:bg-secondary">
            Matches
          </Link>
          <Link href="/profile" className="rounded-md px-2.5 py-1.5 hover:bg-secondary">
            Profile
          </Link>
          <Link href="/upgrade" className="rounded-md px-2.5 py-1.5 hover:bg-secondary">
            Premium
          </Link>
          {user?.role === "admin" ? (
            <Link href="/admin" className="rounded-md px-2.5 py-1.5 hover:bg-secondary">
              Admin
            </Link>
          ) : null}
          {user ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-1 h-8")}
              >
                Sign out{user.firstName ? `, ${user.firstName}` : ""}
              </button>
            </form>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "ml-1 h-8 px-3")}>
              Try the demo
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
