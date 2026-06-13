import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redline — a tachometer for your mental load",
  description:
    "A check-engine light for student burnout. Reads typing rhythm (timing only) and surfaces mental load before a crisis hits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
