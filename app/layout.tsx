import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreflightQA",
  description: "공개 페이지를 읽고 기능 목록 초안을 만듭니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
