import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card stack">
        <h1>Простой аукцион</h1>
        <p>Администратор создает лоты и отправляет покупателям прямые ссылки.</p>
        <Link className="button" href="/admin">
          Открыть админку
        </Link>
      </div>
    </main>
  );
}
