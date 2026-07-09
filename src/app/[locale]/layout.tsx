import { isValidLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

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
  return <>{children}</>;
}
