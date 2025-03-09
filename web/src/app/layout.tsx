import type { Metadata } from "next";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import { Rochester } from "@/lib/fonts";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Kinghtmare",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryClientProvider>
      <html lang="en">
        <body
          className={`${Rochester.variable} bg-[#1E1E1C] `}
        >
          <Sidebar />
          {children}
          <Toaster />
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}