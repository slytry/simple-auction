"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error || "Не удалось войти");
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h1>Вход в админку</h1>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button className="button" type="submit" disabled={loading}>
        {loading ? "Проверяем..." : "Войти"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
