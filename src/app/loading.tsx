export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">Loading…</p>
      <div className="mt-6 space-y-3">
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
