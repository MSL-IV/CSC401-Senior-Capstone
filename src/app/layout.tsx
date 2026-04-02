import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import AdaControls from "@/components/ada-controls";

export const metadata: Metadata = {
  title: "UT Makerspace",
  description: "Innovation hub for University of Tampa students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="font-body antialiased"
        style={
          {
            "--font-heading": '"Helvetica Neue", Helvetica, Arial, sans-serif',
            "--font-body": '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          } as CSSProperties
        }
      >
        {children}
        <AdaControls />
      </body>
    </html>
  );
}
