import "./globals.css";

export const metadata = {
  title: "InspectPro · Inspecciones de daños — Ajustador bilingüe",
  description:
    "Agenda una inspección de daños con un ajustador profesional bilingüe (ES/EN). Respuesta en menos de 2 horas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
