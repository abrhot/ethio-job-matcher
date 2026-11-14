import type { Metadata } from "next";
import { Fraunces, Noto_Sans_Ethiopic, Outfit } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth/session";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "700"],
  variable: "--font-ethiopic",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Sera — Ethiopian jobs, matched to you",
    template: "%s · Sera",
  },
  description:
    "Sera reads Ethiopian job boards and Telegram channels, matches them to your CV, and sends a short reason with the apply link.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} ${ethiopic.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader user={user ? { firstName: user.firstName, role: user.role } : null} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
