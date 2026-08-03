import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ReClaim AI Commercial Assistant",
  description: "AI-powered Commercial Director for ReClaim",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto bg-slate-950">
          {children}
        </main>
      </body>
    </html>
  );
}
