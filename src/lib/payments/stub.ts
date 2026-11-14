import { randomUUID } from "node:crypto";
import type { CheckoutInput, CheckoutResult, PaymentProvider } from "./types";

export class StubProvider implements PaymentProvider {
  readonly name = "stub";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const reference = `stub_${randomUUID().slice(0, 8)}`;
    const checkout = new URL("/upgrade/confirm", input.appUrl);
    checkout.searchParams.set("ref", reference);
    return {
      provider: this.name,
      reference,
      status: "pending",
      checkoutUrl: checkout.toString(),
    };
  }

  async verify(): Promise<"pending" | "paid" | "failed"> {
    return "pending";
  }
}
