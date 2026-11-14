import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-base text-foreground">Sera</span>
          <span lang="am"> · ሥራህን እንፈልግልሃለን</span>
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/jobs" className="hover:text-foreground">
            Matches
          </Link>
          <Link href="/upgrade" className="hover:text-foreground">
            Premium, 299 ETB
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    </footer>
  );
}
