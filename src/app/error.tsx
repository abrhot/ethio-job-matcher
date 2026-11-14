"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20" role="alert">
      <h1 className="font-display text-4xl text-[#143226]">This page did not load</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        If you just cloned the app, start Postgres and run the seed. Otherwise try the page again.
      </p>
      <Button type="button" onClick={reset} className="mt-6 h-10 px-4">
        Try again
      </Button>
    </div>
  );
}
