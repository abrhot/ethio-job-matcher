import { ChapaProvider, TelebirrProvider } from "./providers";
import { StubProvider } from "./stub";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER || "stub").toLowerCase();
  if (name === "chapa") return new ChapaProvider();
  if (name === "telebirr") return new TelebirrProvider();
  return new StubProvider();
}
