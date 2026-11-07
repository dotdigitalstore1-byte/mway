import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mway Quot — Solar Quotation Maker for M Way Solar",
  description:
    "Create professional solar quotations with panel and inverter options, automatic brand logos, structure and KSEB charges, and a print-ready 10-page proposal.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) inject attributes
          into <body> before React hydrates; this silences that harmless warning. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
