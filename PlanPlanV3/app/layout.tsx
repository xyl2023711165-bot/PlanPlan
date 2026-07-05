import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanPlan - 学习任务管理系统",
  description: "AI驱动的学习任务管理助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
