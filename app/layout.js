import "./globals.css";

export const metadata = {
  title: "Простой аукцион",
  description: "Минимальный аукцион на Supabase"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
