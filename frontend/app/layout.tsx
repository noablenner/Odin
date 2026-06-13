import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Odin — Your AI Business Agent",
  description:
    "Connect all your tools and get a persistent AI agent that knows everything about your company.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
