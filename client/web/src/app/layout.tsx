import type { Metadata } from "next";
import { Rochester, Poppins } from "next/font/google";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import "./globals.css";
import { twMerge } from "tailwind-merge";

const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap"
});

const rochester = Rochester({
  weight: ["400"],
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
        <body
          className={`${poppins.className} ${rochester.className} bg-black`}
          style={{
            backgroundImage: "url('/background_1.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          {children}
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
