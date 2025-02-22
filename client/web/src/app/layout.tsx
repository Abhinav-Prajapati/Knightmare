import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Quick chess",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ReactQueryClientProvider>
      <html lang="en">
        <body className={`${poppins.className} bg-black`}>
          {children}
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
