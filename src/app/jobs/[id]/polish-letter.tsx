"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { polishLetter, type LetterState } from "./letter-action";

export function PolishLetter({ jobId, initial }: { jobId: string; initial: string }) {
  const [state, action, pending] = useActionState(polishLetter, {
    text: initial,
    via: "template",
  } satisfies LetterState);
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="jobId" value={jobId} />
      <p className="whitespace-pre-wrap text-sm leading-7">{state.text}</p>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-[#8d2f24]">
          {state.error}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        {state.via === "llm" ? "Rewritten with the configured model." : "Template draft."}
      </p>
      <Button type="submit" variant="outline" className="mt-3 h-10 bg-card px-4" disabled={pending}>
        {pending ? "Writing…" : "Rewrite draft"}
      </Button>
    </form>
  );
}
