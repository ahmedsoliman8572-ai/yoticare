import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "YotiCare — Premium Body Care Products",
    template: "%s | YotiCare",
  },
  description:
    "Discover premium body care products — body splashes, deodorants, lotions, shampoos and more. Fast delivery across Egypt.",
  keywords: [
    "body care",
    "body splash",
    "deodorant",
    "body lotion",
    "shampoo",
    "Egypt",
    "يوتي كير",
    "العناية بالجسم",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
