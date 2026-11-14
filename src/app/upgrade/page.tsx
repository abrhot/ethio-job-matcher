import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isPremium } from "@/lib/config";
import { formatWhen } from "@/lib/format";
import { PREMIUM_PLAN } from "@/lib/payments/types";
import { startCheckout } from "./actions";

export const metadata: Metadata = { title: "Premium" };

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const premium = isPremium(user);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-[#143226]">Premium</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {PREMIUM_PLAN.amountEtb} ETB for {PREMIUM_PLAN.days} days. You get a cover-letter draft and
        CV notes on each match. Matching and Telegram alerts stay free.
      </p>
      {params.error ? (
        <p role="alert" className="mt-4 rounded-lg bg-[#f8e6e2] px-3 py-2 text-sm text-[#8d2f24]">
          Checkout could not be started. The payment provider may be missing its keys.
        </p>
      ) : null}
      {premium ? (
        <p role="status" className="mt-4 rounded-lg bg-[#e5f2ea] px-3 py-2 text-sm text-[#145c38]">
          Premium is active until {formatWhen(user.premiumUntil)}.
        </p>
      ) : (
        <form action={startCheckout} className="mt-6 rounded-2xl bg-[#143226] p-6 text-[#f7f3e8]">
          <p className="font-display text-4xl">{PREMIUM_PLAN.amountEtb} ETB</p>
          <p className="mt-2 text-sm leading-6 text-[#d7d2c6]">
            The default provider is a stub. Confirming it marks your account premium and does not
            call Chapa or Telebirr.
          </p>
          <Button type="submit" variant="secondary" className="mt-5 h-10 px-4">
            Start demo checkout
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/jobs" className="text-[#145c38] underline">
          Back to matches
        </Link>
      </p>
    </div>
  );
}
