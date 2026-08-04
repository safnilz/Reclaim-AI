import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CRM AI Assistant Commercial Assistant",
  description: "AI-powered Commercial Director for ReClaim",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto bg-slate-50">
          {children}
        </main>
      </body>
    </html>
  );
}
