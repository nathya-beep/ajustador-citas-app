export type Locale = "en" | "es";

export const locales: Locale[] = ["en", "es"];
export const defaultLocale: Locale = "es";

export const dictionary = {
  en: {
    heroTitle: "Fast, reliable insurance inspections",
    heroSubtitle: "Book your inspection appointment online in minutes.",
    scheduleCta: "Schedule an inspection",
    contactFormTitle: "Have a question? Contact us",
  },
  es: {
    heroTitle: "Inspecciones de seguros rápidas y confiables",
    heroSubtitle: "Agenda tu cita de inspección en línea en minutos.",
    scheduleCta: "Agendar una inspección",
    contactFormTitle: "¿Tienes una pregunta? Contáctanos",
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary[defaultLocale];
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
