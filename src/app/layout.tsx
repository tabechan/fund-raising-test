import type { Metadata } from "next";
import { Kosugi, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ProjectProvider } from "@/context/ProjectContext";

const kosugi = Kosugi({
  weight: "400",
  variable: "--font-kosugi",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "融資支援AI（仮）",
  description: "融資・公庫・補助金の提出書類を整え、審査シミュレーションを支援するサービス",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${kosugi.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
