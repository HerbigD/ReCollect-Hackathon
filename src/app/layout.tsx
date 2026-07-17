import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReCollect — Stop saving, start using.",
  description: "Turn scattered saves into useful, grounded artifacts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
