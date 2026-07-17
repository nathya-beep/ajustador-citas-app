import { isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { WhatsappButton } from "./WhatsappButton";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) {
    notFound();
  }
  const locale: Locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  return (
    <>
      {children}
      <WhatsappButton locale={locale} />
    </>
  );
}
