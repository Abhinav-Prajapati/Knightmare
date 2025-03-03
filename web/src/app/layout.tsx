import type { Metadata } from "next";
import { ReactQueryClientProvider } from "@/components/ReactQueryClientProvider";
import "./globals.css";
import { Rochester } from "@/lib/fonts";
import toast, { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Kinghtmare',
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
          className={`${Rochester.variable} bg-black`}
          style={{
            backgroundImage: "url('/background_1.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
