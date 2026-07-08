import "./globals.css";

export const metadata = {
  title: "Inspecciones de Seguros",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
