import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Ehfaaz CRM AI Assistant",
  description: "AI-powered Commercial Director for ReClaim",
};

import NavigationLayout from "@/components/NavigationLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <NavigationLayout sidebar={<Sidebar />}>
          {children}
        </NavigationLayout>
      </body>
    </html>
  );
}
