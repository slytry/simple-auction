import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container">
      <div className="card stack">
        <h1>Не найдено</h1>
        <p>Такого аукционного лота не существует.</p>
        <Link className="button" href="/">
          На главную
        </Link>
      </div>
    </main>
  );
}
