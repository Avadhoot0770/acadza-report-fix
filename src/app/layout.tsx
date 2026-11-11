import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Acadza – Report → Fix | AI Triage & Faculty Review",
  description:
    "AI-powered question-quality triage and faculty review system for JEE/NEET questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/50 flex font-sans antialiased text-slate-900">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
