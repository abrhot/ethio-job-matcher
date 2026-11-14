import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-display text-4xl text-[#143226]">That page is not here</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The job may have been removed, or the link is wrong.
      </p>
      <Link href="/jobs" className="mt-4 inline-block text-sm text-[#145c38] underline">
        Back to matches
      </Link>
    </div>
  );
}
