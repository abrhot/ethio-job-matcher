export interface CheckoutInput {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  plan: "premium_monthly";
  amountEtb: number;
  appUrl: string;
}

export interface CheckoutResult {
  provider: string;
  reference: string;
  status: "pending" | "paid" | "failed";
  checkoutUrl: string | null;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verify(reference: string): Promise<"pending" | "paid" | "failed">;
}

export class PaymentNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} is not configured. Add the provider keys. No charge was attempted.`);
    this.name = "PaymentNotConfiguredError";
  }
}

export const PREMIUM_PLAN = {
  id: "premium_monthly" as const,
  amountEtb: 299,
  days: 30,
  name: "Sera Premium",
};
