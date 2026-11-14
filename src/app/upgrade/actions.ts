"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { appUrl } from "@/lib/config";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { PREMIUM_PLAN } from "@/lib/payments/types";
import { paymentReferenceSchema } from "@/lib/validation";

export async function startCheckout() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const provider = getPaymentProvider();
  const checkout = await provider.createCheckout({
    userId: user.id,
    email: user.email,
    fullName: user.profile?.fullName || user.firstName,
    plan: "premium_monthly",
    amountEtb: PREMIUM_PLAN.amountEtb,
    appUrl: appUrl(),
  });
  await prisma.payment.create({
    data: {
      userId: user.id,
      provider: checkout.provider,
      amountEtb: PREMIUM_PLAN.amountEtb,
      plan: PREMIUM_PLAN.id,
      status: "pending",
      reference: checkout.reference,
      checkoutUrl: checkout.checkoutUrl,
    },
  });
  if (!checkout.checkoutUrl) redirect("/upgrade?error=checkout");
  redirect(checkout.checkoutUrl);
}

export async function confirmPayment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = paymentReferenceSchema.safeParse(formData.get("ref"));
  if (!parsed.success) redirect("/upgrade?error=reference");
  const payment = await prisma.payment.findUnique({ where: { reference: parsed.data } });
  if (!payment || payment.userId !== user.id) redirect("/upgrade?error=missing");
  if (payment.status !== "paid") {
    if (payment.provider !== "stub") {
      const status = await getPaymentProvider().verify(parsed.data);
      if (status !== "paid") redirect(`/upgrade/confirm?ref=${parsed.data}&error=unpaid`);
    }
    const until = new Date(Date.now() + PREMIUM_PLAN.days * 86_400_000);
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "paid" } }),
      prisma.user.update({
        where: { id: user.id },
        data: { tier: "premium", premiumUntil: until },
      }),
    ]);
  }
  redirect("/jobs?notice=premium");
}
