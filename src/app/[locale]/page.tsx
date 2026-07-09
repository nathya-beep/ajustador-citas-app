import Link from "next/link";
import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";

export default function LandingPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <main>
      <h1>{t.heroTitle}</h1>
      <p>{t.heroSubtitle}</p>
      <Link href={`/${locale}/schedule`}>{t.scheduleCta}</Link>
    </main>
  );
}
