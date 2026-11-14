import { randomUUID } from "node:crypto";
import {
  PaymentNotConfiguredError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
} from "./types";

/**
 * Chapa (https://developer.chapa.co) initialize-transaction call.
 * Used only when PAYMENT_PROVIDER=chapa and CHAPA_SECRET_KEY is set.
 * The demo defaults to the stub provider and never calls Chapa.
 */
export class ChapaProvider implements PaymentProvider {
  readonly name = "chapa";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) throw new PaymentNotConfiguredError("Chapa");
    const reference = `chapa_${randomUUID().slice(0, 12)}`;
    const [firstName, ...rest] = (input.fullName || "Sera Seeker").split(" ");
    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        amount: String(input.amountEtb),
        currency: "ETB",
        email: input.email || "seeker@sera.local",
        first_name: firstName,
        last_name: rest.join(" ") || "Seeker",
        tx_ref: reference,
        callback_url: `${input.appUrl}/api/payments/chapa/webhook`,
        return_url: `${input.appUrl}/upgrade/confirm?ref=${reference}`,
        customization: {
          title: "Sera Premium",
          description: "30 days of tailored applications",
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`Chapa initialize failed (${response.status}).`);
    }
    const payload = (await response.json()) as { data?: { checkout_url?: string } };
    return {
      provider: this.name,
      reference,
      status: "pending",
      checkoutUrl: payload.data?.checkout_url ?? null,
    };
  }

  async verify(reference: string): Promise<"pending" | "paid" | "failed"> {
    const secret = process.env.CHAPA_SECRET_KEY;
    if (!secret) throw new PaymentNotConfiguredError("Chapa");
    const response = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { authorization: `Bearer ${secret}` },
      },
    );
    if (!response.ok) return "failed";
    const payload = (await response.json()) as { data?: { status?: string } };
    if (payload.data?.status === "success") return "paid";
    if (payload.data?.status === "failed") return "failed";
    return "pending";
  }
}

/**
 * Telebirr's fabric gateway needs a signed app token and a merchant short code.
 * This class is the seam for that work. It does not sign or submit orders.
 */
export class TelebirrProvider implements PaymentProvider {
  readonly name = "telebirr";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    void input.plan;
    if (
      !process.env.TELEBIRR_FABRIC_APP_ID ||
      !process.env.TELEBIRR_APP_SECRET ||
      !process.env.TELEBIRR_SHORT_CODE
    ) {
      throw new PaymentNotConfiguredError("Telebirr");
    }
    throw new Error(
      "Telebirr is not wired in this MVP. Implement fabric-token signing inside TelebirrProvider.createCheckout before taking live payments.",
    );
  }

  async verify(reference: string): Promise<"pending" | "paid" | "failed"> {
    void reference;
    throw new PaymentNotConfiguredError("Telebirr");
  }
}
