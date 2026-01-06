import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import { cx } from "@/components/ui/cx";

export const metadata: Metadata = {
  title: "OpenAI API Deal Sizer",
  description: "Estimate OpenAI API costs with scenario bands, model comparisons, and pricing tier selection."
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/#how-to-use", label: "How to Use" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-bg">
        <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6 sm:px-6">
          <header className="flex items-center justify-between">
            <Link href="/" className="group inline-flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">OpenAI API Deal Sizer</span>
              <span className="text-xs font-medium text-ink-500 group-hover:text-ink-700">Estimator</span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-white/60 hover:text-ink-900 focus:outline-none focus:ring-2 focus:ring-sky-300",
                    "transition-colors"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="mt-6">{children}</main>

          <footer className="mt-10 border-t border-ink-200/70 pt-6 text-xs text-ink-500">
            <p>
              Estimates only. Reasoning tokens are billed as output tokens. Pricing source:{" "}
              <a
                className="underline underline-offset-2 hover:text-ink-700"
                href="https://platform.openai.com/docs/pricing"
                target="_blank"
                rel="noreferrer"
              >
                OpenAI pricing
              </a>
              .
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
