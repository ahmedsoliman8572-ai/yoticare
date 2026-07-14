import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Playfair_Display, Inter, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import PixelTracker from "@/components/PixelTracker";
import WhatsAppButton from "@/components/layout/WhatsAppButton";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${playfair.variable} ${inter.variable} ${cairo.variable} h-full antialiased`}
    >
      <head>
        <PixelTracker />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <WhatsAppButton />
          <Toaster
            position={isRTL ? "top-left" : "top-right"}
            richColors
            closeButton
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
