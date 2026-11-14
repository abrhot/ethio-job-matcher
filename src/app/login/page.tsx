import type { Metadata } from "next";
import { demoLogin } from "./actions";
import { TelegramLogin } from "./telegram-login";
import { Button } from "@/components/ui/button";
import { demoMode } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  disabled: "Demo sign-in is turned off. Use Telegram login.",
  seed: "Demo profiles are missing. Run npm run db:seed.",
  telegram: "Telegram did not accept that login.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? errors[params.error] : null;
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-2">
      <section>
        <h1 className="font-display text-4xl text-[#143226]">Sign in</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Telegram is the real account. The two demo people below are seeded profiles so you can see
          different matches without a bot token.
        </p>
        {message ? (
          <p role="alert" className="mt-4 rounded-lg bg-[#f8e6e2] px-3 py-2 text-sm text-[#8d2f24]">
            {message}
          </p>
        ) : null}
        <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-medium">Telegram</h2>
          {botUsername ? (
            <div className="mt-3">
              <TelegramLogin username={botUsername} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Set <code>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> and <code>TELEGRAM_BOT_TOKEN</code>{" "}
              to enable the login widget. Until then, use a demo profile.
            </p>
          )}
        </div>
      </section>
      <section aria-labelledby="demo-heading" className="space-y-3">
        <h2 id="demo-heading" className="font-display text-2xl">
          Demo profiles
        </h2>
        {!demoMode() ? <p className="text-sm">Demo sign-in is disabled on this server.</p> : null}
        <form action={demoLogin} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <input type="hidden" name="persona" value="hana" />
          <h3 className="font-medium">Hana Tadesse</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Fifth-year software engineering student in Addis Ababa. React, Next.js, Node,
            PostgreSQL. This profile can open Admin.
          </p>
          <Button type="submit" className="mt-4 h-10 px-4" disabled={!demoMode()}>
            Continue as Hana
          </Button>
        </form>
        <form action={demoLogin} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <input type="hidden" name="persona" value="dawit" />
          <h3 className="font-medium">Dawit Bekele</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Junior accountant in Addis Ababa. Excel, accounting, and finance. On-site roles only.
          </p>
          <Button
            type="submit"
            variant="outline"
            className="mt-4 h-10 bg-card px-4"
            disabled={!demoMode()}
          >
            Continue as Dawit
          </Button>
        </form>
      </section>
    </div>
  );
}
