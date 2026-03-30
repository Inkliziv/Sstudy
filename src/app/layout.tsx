import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S-Study - Onlayn Ta'lim Platformasi",
  description: "Talabalar uchun mustaqil ta'limni tashkil etish platformasi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
