import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yoticare.vercel.app"),
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
  openGraph: {
    title: "YotiCare — Premium Body Care Products",
    description: "Discover premium body care products — body splashes, deodorants, lotions, shampoos and more. Fast delivery across Egypt.",
    url: "https://yoticare.vercel.app",
    siteName: "YotiCare",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "YotiCare Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YotiCare — Premium Body Care Products",
    description: "Discover premium body care products — body splashes, deodorants, lotions, shampoos and more. Fast delivery across Egypt.",
    images: ["/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
