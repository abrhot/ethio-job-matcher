import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { paymentReferenceSchema } from "@/lib/validation";
import { confirmPayment } from "../actions";

export const metadata: Metadata = { title: "Confirm premium" };

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = paymentReferenceSchema.safeParse(params.ref);
  if (!parsed.success) redirect("/upgrade?error=reference");
  const payment = await prisma.payment.findUnique({ where: { reference: parsed.data } });
  if (!payment || payment.userId !== user.id) redirect("/upgrade?error=missing");
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl text-[#143226]">Confirm premium</h1>
      {payment.provider === "stub" ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This is the local stub. No birr moves. Activating it turns on cover letters for 30 days so
          you can see the premium screen.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6">
          We will ask {payment.provider} whether reference {payment.reference} is paid.
        </p>
      )}
      {params.error === "unpaid" ? (
        <p role="alert" className="mt-4 text-sm text-[#8d2f24]">
          The provider has not marked this payment as paid.
        </p>
      ) : null}
      <p className="mt-4 text-sm">
        Amount: {payment.amountEtb} ETB · status: {payment.status}
      </p>
      {payment.status === "paid" ? (
        <p className="mt-4 text-sm text-[#145c38]">Already active.</p>
      ) : (
        <form action={confirmPayment} className="mt-6">
          <input type="hidden" name="ref" value={payment.reference} />
          <Button type="submit" className="h-10 px-4">
            {payment.provider === "stub" ? "Activate 30 days" : "Verify payment"}
          </Button>
        </form>
      )}
    </div>
  );
}
