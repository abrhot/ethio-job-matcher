export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3847").replace(/\/$/, "");
}

export function demoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export function isPremium(user: { tier: string; premiumUntil: Date | null }): boolean {
  return (
    user.tier === "premium" && user.premiumUntil != null && user.premiumUntil.getTime() > Date.now()
  );
}
