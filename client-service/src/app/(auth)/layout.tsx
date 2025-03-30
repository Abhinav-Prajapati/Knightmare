import Image from "next/image";
import React from "react";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundImage: "url('/images/auth-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src={"/images/logo.png"}
        width={200}
        height={200}
        alt="knightmare logo"
        className=" absolute bottom-8 left-8 z-10"
      />
      <div className=" absolute right-20 h-screen flex items-center  ">
        {children}
      </div>
      <div className=" absolute w-full h-[18rem] bottom-0 bg-gradient-to-t from-black/70 to-transparent"></div>
    </div>
  );
}
