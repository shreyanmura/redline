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
      <head>
        {/* Marker the Redline extension's content script looks for, to bridge
            recorded sessions from chrome.storage into this page. */}
        <meta name="redline-app" content="dashboard" />
      </head>
      <body className="grain bg-ink text-white antialiased selection:bg-rl-red/30">
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  );
}
