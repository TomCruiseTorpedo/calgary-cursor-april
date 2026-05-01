import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display-serif",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI tools funnel",
  description:
    "Rank AI tools by evidence-shaped signals and role fit; optional OpenRouter guides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
