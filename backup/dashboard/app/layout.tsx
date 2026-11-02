import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreflightQA",
  description: "Read public pages and draft a feature list.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
