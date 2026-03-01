import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeLikeSportz – Bet Smarter",
  description:
    "Real-time odds across 40+ sports from the world's top bookmakers. Make smarter, data-driven betting decisions.",
  keywords: ["sports betting", "odds comparison", "betting tips", "sports odds"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}
